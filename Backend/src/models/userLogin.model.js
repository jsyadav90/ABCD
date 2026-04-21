/**
 * UserLogin Model
 * 
 * Logics:
 * - Credentials:
 *   username (unique, lowercase), password (hashed in pre-save hook).
 * - User Link:
 *   user (ref User, unique) ensures one credential per user.
 * - Security Flags:
 *   forcePasswordChange, failedLoginAttempts, lockLevel, lockUntil, isPermanentlyLocked.
 * - Session State:
 *   isLoggedIn, lastLogin, loggedInDevices with per-device refreshToken and history.
 * - Hooks/Methods:
 *   - pre('save'): hash password if modified.
 *   - comparePassword(candidate): bcrypt compare.
 *   - generateAccessToken(deviceId): JWT with optional device versioning.
 *   - generateRefreshToken(deviceId, ip, ua): issues refresh, updates device entries, persists.
 */

import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const userLoginSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    // PIN for quick re-authentication (optional, 4-6 digits)
    pin: {
      type: String,
      default: null,
      select: false,
      note: 'Hashed PIN for optional quick authentication (4-6 digits)'
    },
    // Force user to change password on next login
    forcePasswordChange: {
      type: Boolean,
      default: false,
    },
    refreshTokens: [
      {
        token: { type: String },
        deviceId: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    failedLoginAttempts: { type: Number, default: 0 },
    lockLevel: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    isPermanentlyLocked: { type: Boolean, default: false },
    isLoggedIn: { type: Boolean, default: false },
    lastLogin: { type: Date },
    // Start date for password expiry clock (set on first login after password change)
    passwordExpiryStart: { type: Date, default: null },
    lastPasswordChange: [
      {
        // When the password was changed
        changedAt: { type: Date, default: Date.now },
        
        // Network and Device Information
        ipAddress: String, // IP address from which change was initiated
        
        deviceId: String, // Device identifier if changed from logged-in device
        
        // Who Changed It
       
        changedByUserId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          default: null, // Null if self, otherwise admin user ID
        },
        
        
          
        // Previous Password Hash (for recovery purposes - encrypted)
        previousPasswordHash: String, // Can be used to prevent reuse
        
        // Audit Trail
        // mfaVerified: { type: Boolean, default: false }, // Was MFA verified for this change
        requiresVerification: { type: Boolean, default: false }, // Needs email/phone verification
        verificationCode: { type: String, select: false }, // Hashed verification code
        verificationExpiresAt: Date,
        verificationAttempts: { type: Number, default: 0 },
        
        // Session Information
        sessionId: String, // Session ID in which change was made
        correlationId: String, // For tracking related operations
      }
      
    ],
    totalLoginCount: { type: Number, default: 0 }, // Total number of successful logins across all devices
    loggedInDevices: [
      {
        deviceId: { type: String, default: () => uuidv4() },
        ipAddress: String,
        userAgent: String,
        loginCount: { type: Number, default: 0 },
        refreshToken: String,
        tokenVersion: { type: Number, default: 0 },
        loginHistory: [
          {
            loginAt: { type: Date, default: Date.now },
            logoutAt: Date,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// Password and PIN Hash - Modern mongoose async pre-hook (no next param)
userLoginSchema.pre("save", async function () {
  // Hash password if modified
  if (this.isModified("password")) {
    try {
      const salt = await bcryptjs.genSalt(10);
      this.password = await bcryptjs.hash(this.password, salt);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  // Hash PIN if modified
  if (this.isModified("pin") && this.pin) {
    try {
      const salt = await bcryptjs.genSalt(10);
      this.pin = await bcryptjs.hash(this.pin, salt);
    } catch (error) {
      throw new Error(`PIN hashing failed: ${error.message}`);
    }
  }
});

// Password Compare
userLoginSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

// PIN Compare
userLoginSchema.methods.comparePin = async function (candidatePin) {
  if (!this.pin) return false; // PIN not set
  return await bcryptjs.compare(candidatePin, this.pin);
};

// Token Generators
userLoginSchema.methods.generateAccessToken = function (deviceId = null) {
  const payload = {
    id: this.user,
    username: this.username,
  };

  if (deviceId) {
    payload.deviceId = deviceId;
    const device = Array.isArray(this.loggedInDevices)
      ? this.loggedInDevices.find((d) => d.deviceId === deviceId)
      : null;
    payload.deviceTokenVersion = device ? (device.tokenVersion || 0) : 0;
  }

  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET || "ACCESS_TOKEN_DEFAULT",
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );
};

userLoginSchema.methods.generateRefreshToken = async function (deviceId, ipAddress = null, userAgent = null) {
  const token = jwt.sign(
    { id: this.user },
    process.env.REFRESH_TOKEN_SECRET || "REFRESH_TOKEN_DEFAULT",
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    }
  );

  const devId = deviceId || "unknown";

  // refreshTokens array = only currently active tokens (one per device)
  if (!Array.isArray(this.refreshTokens)) {
    this.refreshTokens = [];
  }
  // Remove any existing token for this device (old token when refreshing)
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.deviceId !== devId);
  this.refreshTokens.push({
    token,
    deviceId: devId,
    createdAt: new Date(),
  });

  // Store token on that device - create device if it doesn't exist
  if (deviceId && Array.isArray(this.loggedInDevices)) {
    let device = this.loggedInDevices.find((d) => d.deviceId === deviceId);
    if (device) {
      // Update existing device
      device.refreshToken = token;
      device.loginCount = (device.loginCount || 0) + 1;
      if (ipAddress) device.ipAddress = ipAddress;
      if (userAgent) device.userAgent = userAgent;
      // Ensure tokenVersion is initialized (important after logout and re-login)
      if (!device.tokenVersion) {
        device.tokenVersion = 0;
      }
      device.loginHistory.push({
        loginAt: new Date(),
        logoutAt: null,
      });
    } else {
      // Create new device entry
      this.loggedInDevices.push({
        deviceId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        refreshToken: token,
        loginCount: 1,
        tokenVersion: 0,
        loginHistory: [
          {
            loginAt: new Date(),
            logoutAt: null,
          },
        ],
      });
    }
  }

  await this.save();
  return token;
};

// Verify refresh token for specific device
userLoginSchema.methods.verifyRefreshTokenForDevice = function (token, deviceId) {
  if (!deviceId || !Array.isArray(this.loggedInDevices)) {
    return false;
  }

  const device = this.loggedInDevices.find((d) => d.deviceId === deviceId);
  if (!device) {
    return false;
  }

  // Check if token matches the device's refresh token
  return device.refreshToken === token;
};

// Get all active devices for a user
userLoginSchema.methods.getActiveDevices = function () {
  if (!Array.isArray(this.loggedInDevices)) {
    return [];
  }

  return this.loggedInDevices.map((device) => ({
    deviceId: device.deviceId,
    ipAddress: device.ipAddress,
    userAgent: device.userAgent,
    loginCount: device.loginCount,
    lastLogin: device.loginHistory?.[device.loginHistory.length - 1]?.loginAt,
  }));
};

// Logout specific device
userLoginSchema.methods.logoutDevice = async function (deviceId) {
  if (!deviceId || !Array.isArray(this.loggedInDevices)) {
    return false;
  }

  const device = this.loggedInDevices.find((d) => d.deviceId === deviceId);
  if (device) {
    // Mark last login as logged out
    if (device.loginHistory && device.loginHistory.length > 0) {
      const lastLogin = device.loginHistory[device.loginHistory.length - 1];
      if (!lastLogin.logoutAt) {
        lastLogin.logoutAt = new Date();
      }
    }
    // Clear the refresh token on device
    device.refreshToken = null;
    // Remove this device's token from refreshTokens array (keep only active tokens)
    if (Array.isArray(this.refreshTokens)) {
      this.refreshTokens = this.refreshTokens.filter((rt) => rt.deviceId !== deviceId);
    }
    // Increment device token version to invalidate existing access tokens for this device
    device.tokenVersion = (device.tokenVersion || 0) + 1;
    await this.save();
    return true;
  }

  return false;
};

// Logout all devices
userLoginSchema.methods.logoutAllDevices = async function () {
  if (Array.isArray(this.loggedInDevices)) {
    this.loggedInDevices.forEach((device) => {
      if (device.loginHistory && device.loginHistory.length > 0) {
        const lastLogin = device.loginHistory[device.loginHistory.length - 1];
        if (!lastLogin.logoutAt) {
          lastLogin.logoutAt = new Date();
        }
      }
      device.refreshToken = null;
      device.tokenVersion = (device.tokenVersion || 0) + 1;
    });
  }
  // All devices logged out → refreshTokens should be empty
  this.refreshTokens = [];
  await this.save();
};

// Get all currently active refresh tokens (only logged-in devices)
userLoginSchema.methods.getAllRefreshTokens = function () {
  return Array.isArray(this.refreshTokens) ? this.refreshTokens : [];
};

// Revoke specific refresh token (also clear from device so refreshTokens stays in sync)
userLoginSchema.methods.revokeRefreshToken = async function (token) {
  if (!Array.isArray(this.refreshTokens)) return false;
  const hadToken = this.refreshTokens.some((rt) => rt.token === token);
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
  // Clear this token from loggedInDevices so device is considered logged out
  if (Array.isArray(this.loggedInDevices)) {
    const device = this.loggedInDevices.find((d) => d.refreshToken === token);
    if (device) {
      device.refreshToken = null;
      device.tokenVersion = (device.tokenVersion || 0) + 1;
    }
  }
  await this.save();
  return hadToken;
};

// Record password change in audit trail
userLoginSchema.methods.recordPasswordChange = async function (options = {}) {
  const {
    ipAddress = null,
    userAgent = null,
    deviceId = null,
    changedBy = "Self", // "Self", "Admin", "System"
    changedByUserId = null,
    changedByUsername = null,
    changeType = "SelfInitiated", // SelfInitiated, AdminForcedReset, AdminPasswordSet, etc.
    method = "DirectChange", // DirectChange, EmailVerification, PhoneOTP, etc.
    reason = null,
    previousPasswordHash = null,
    mfaVerified = false,
    sessionId = null,
    correlationId = null,
  } = options;

  if (!Array.isArray(this.lastPasswordChange)) {
    this.lastPasswordChange = [];
  }

  // Record the password change
  this.lastPasswordChange.push({
    changedAt: new Date(),
    ipAddress,
    userAgent,
    deviceId,
    changedBy,
    changedByUserId: changedByUserId || null,
    // changedByUsername,
    changeType,
    method,
    reason,
    status: "Completed",
    previousPasswordHash,
    // mfaVerified,
    requiresVerification: false,
    verificationAttempts: 0,
    sessionId,
    correlationId,
  });

  // Keep only last 50 password change records
  if (this.lastPasswordChange.length > 50) {
    this.lastPasswordChange = this.lastPasswordChange.slice(-50);
  }

  await this.save();
};

// Get password change history
userLoginSchema.methods.getPasswordChangeHistory = function (limit = 10) {
  if (!Array.isArray(this.lastPasswordChange)) {
    return [];
  }
  return this.lastPasswordChange.slice(-limit).reverse();
};

export const UserLogin = mongoose.model("UserLogin", userLoginSchema);
