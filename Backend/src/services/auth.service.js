/**
 * Auth Service
 * 
 * Logics:
 * - login(loginId, password, deviceId, ipAddress, userAgent):
 *   Validates loginId, resolves UserLogin by username/userId/email,
 *   enforces locks, verifies password, enforces user.canLogin && user.isActive,
 *   enforces org auth settings (optional), resets counters, generates access/refresh tokens,
 *   returns user with deduped permissions and deviceId.
 * - logout(userId, deviceId):
 *   Logs out a specific device if given; otherwise all devices.
 * - logoutAllDevices(userId):
 *   Revokes all devices for the user.
 * - getActiveDevices(userId):
 *   Returns devices still carrying a refresh token.
 * - revokeToken(userId, token):
 *   Removes a specific refresh token from any device.
 * - changePassword(userId, oldPassword, newPassword):
 *   Verifies old password, updates password, logs out all devices.
 * - refreshTokens(refreshToken, deviceId?):
 *   Validates refresh token, rotates token for device, returns a new access token.
 * - validateAccessToken(token):
 *   Verifies access token and returns decoded payload details.
 */

import jwt from "jsonwebtoken";
import { UserLogin } from "../models/userLogin.model.js";
import { User } from "../models/user.model.js";
import { Organization } from "../models/organization.model.js";
import { apiError } from "../utils/apiError.js";
import { validatePasswordPolicy, validatePINPolicy } from "../utils/passwordPolicy.js";

/**
 * Auth Service - Handles all authentication business logic
 */

// =====================================================
// LOGIN SERVICE
// =====================================================
export const authService = {
  /**
   * Login user with loginId (username/userId/email) and password/PIN
   * @param {string} loginId - Username, userId, or email
   * @param {string} credentialType - Type: "password" or "pin"
   * @param {string} credential - Plain password or PIN
   * @param {string} deviceId - Device identifier
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - Client user agent
   * @returns {Promise<Object>} - User data, access token, refresh token, forcePasswordChange flag
   */
  async login(loginId, credentialType = 'password', credential, deviceId, ipAddress = null, userAgent = null) {
    try {
      const loginIdStr = String(loginId || "").trim();
      if (!loginIdStr) {
        throw new apiError(401, "Invalid login credentials");
      }

      // Find UserLogin by username first (case-insensitive)
      let userLogin = await UserLogin.findOne({ username: loginIdStr.toLowerCase() }).select("+password +pin");

      // If not found by username, try User by userId or email (case-insensitive)
      if (!userLogin) {
        const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escaped = escapeRegex(loginIdStr);
        const user = await User.findOne({
          $or: [
            { userId: { $regex: new RegExp(`^${escaped}$`, "i") } },
            { email: { $regex: new RegExp(`^${escaped}$`, "i") } },
            { personalEmail: { $regex: new RegExp(`^${escaped}$`, "i") } },
          ],
        });

        if (user) {
          userLogin = await UserLogin.findOne({ user: user._id }).select("+password +pin");
        }
      }

      if (!userLogin) {
        console.log(`[LOGIN] ❌ User not found: ${loginIdStr}`);
        throw new apiError(401, "Invalid login credentials");
      }
      
      console.log(`[LOGIN] ✅ User found: ${loginIdStr}, checking credential...`);

      // Check if account is permanently locked
      if (userLogin.isPermanentlyLocked) {
        throw new apiError(403, "Account is permanently locked. Contact administrator.");
      }

      // Check if account is temporarily locked
      if (userLogin.lockUntil && new Date() < userLogin.lockUntil) {
        const remainingTime = Math.ceil(
          (userLogin.lockUntil - new Date()) / (1000 * 60)
        );
        const lockDuration = userLogin.lockLevel === 2 ? 30 : 15;
        throw new apiError(
          429,
          `Account is locked due to multiple failed login attempts. Try again in ${remainingTime} minutes.`
        );
      }

      // Verify credential (password or PIN)
      const credentialStr = String(credential);
      let isCredentialValid = false;
      let usedCredentialType = credentialType;
      
      // Determine which credential to check
      // If PIN is not set, always use password
      if (!userLogin.pin) {
        // PIN not set - must use password
        isCredentialValid = await userLogin.comparePassword(credentialStr);
        usedCredentialType = "password";
      } else if (credentialType === "pin") {
        // PIN is set and user trying to use PIN
        isCredentialValid = await userLogin.comparePin(credentialStr);
      } else {
        // PIN is set but user trying password - allow either
        // Try password first
        isCredentialValid = await userLogin.comparePassword(credentialStr);
        if (!isCredentialValid) {
          // Try PIN if password fails
          isCredentialValid = await userLogin.comparePin(credentialStr);
          if (isCredentialValid) {
            usedCredentialType = "pin";
          }
        }
      }
      
      console.log(`[LOGIN] Credential verification for ${loginIdStr}:`, {
        credentialProvided: credentialStr.substring(0, 3) + '***',
        userFound: true,
        credentialMatch: isCredentialValid,
        failedAttempts: userLogin.failedLoginAttempts,
        credentialType: usedCredentialType
      });
      
      if (!isCredentialValid) {
        // Increment failed attempts
        userLogin.failedLoginAttempts = (userLogin.failedLoginAttempts || 0) + 1;

        // Progressive lock escalation based on failed attempts and current lock level
        if (userLogin.failedLoginAttempts >= 15 && userLogin.lockLevel >= 2) {
          // Permanent lock after 15 total failed attempts and already at level 2
          userLogin.isPermanentlyLocked = true;
          userLogin.lockLevel = 3;
        } else if (userLogin.failedLoginAttempts >= 10 && userLogin.lockLevel >= 1) {
          // 30-minute lock after 10 total failed attempts and already at level 1
          userLogin.lockLevel = 2;
          userLogin.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        } else if (userLogin.failedLoginAttempts >= 5) {
          // 15-minute lock after 5 failed attempts
          userLogin.lockLevel = 1;
          userLogin.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await userLogin.save();
        console.error(`[LOGIN] Credential mismatch for ${loginIdStr}. Attempts: ${userLogin.failedLoginAttempts}, Lock Level: ${userLogin.lockLevel}`);
        throw new apiError(401, "Invalid login credentials");
      }

      // Fetch user details and enforce login flags
      const user = await User.findById(userLogin.user).populate("roleId");
      if (!user) {
        throw new apiError(500, "Associated user not found");
      }

      // Only allow login when canLogin and isActive are true
      if (!user.canLogin || !user.isActive) {
        throw new apiError(401, "Invalid login credentials");
      }

      const orgId = user.organizationId;
      if (orgId) {
        const org = await Organization.findById(orgId).select("enabledFeatures settings").lean();
        const enabled = Array.isArray(org?.enabledFeatures) ? org.enabledFeatures : [];
        const authSettings = org?.settings?.auth;
        if (enabled.includes("AUTH") && authSettings?.roleLoginEnabled) {
          const allowedRoles = Array.isArray(authSettings.allowedLoginRoles) ? authSettings.allowedLoginRoles : [];
          const roleName = String(user.roleId?.name || "").trim();
          if (allowedRoles.length > 0 && roleName && !allowedRoles.includes(roleName)) {
            throw new apiError(403, "Login is disabled for this role");
          }
        }
      }

      // Reset failed attempts on successful login
      userLogin.failedLoginAttempts = 0;
      userLogin.lockLevel = 0;
      userLogin.lockUntil = null;
      userLogin.isLoggedIn = true;
      userLogin.lastLogin = new Date();
      userLogin.totalLoginCount = (userLogin.totalLoginCount || 0) + 1; // Increment total login count

      // Generate tokens
      const accessToken = userLogin.generateAccessToken(deviceId);
      const refreshToken = await userLogin.generateRefreshToken(
        deviceId,
        ipAddress,
        userAgent
      );

      // Fetch user details for response (exclude sensitive fields) and populate role
      const userResponse = await User.findById(userLogin.user)
        .select("-password")
        .populate("roleId");

      let permissions = [];

      if (userResponse && Array.isArray(userResponse.permissions)) {
        permissions = [...userResponse.permissions];
      }

      if (userResponse?.roleId && Array.isArray(userResponse.roleId.permissionKeys)) {
        permissions = [
          ...permissions,
          ...userResponse.roleId.permissionKeys,
        ];
      }

      if (
        userResponse?.roleId &&
        userResponse.roleId.name === "super_admin" &&
        !permissions.includes("*")
      ) {
        permissions.push("*");
      }

      permissions = Array.from(new Set(permissions));

      return {
        success: true,
        user: userResponse,
        accessToken,
        refreshToken,
        permissions,
        forcePasswordChange: !!userLogin.forcePasswordChange,
        deviceId,
        message: "Login successful",
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },
  async reauth(userId, credentialType, credential, deviceId, ipAddress = null, userAgent = null) {
    try {
      // Find UserLogin by user ID
      const userLogin = await UserLogin.findOne({ user: userId }).select("+password +pin");
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      // Check if account is permanently locked
      if (userLogin.isPermanentlyLocked) {
        throw new apiError(403, "Account is permanently locked. Contact administrator.");
      }

      // Check if account is temporarily locked
      if (userLogin.lockUntil && new Date() < userLogin.lockUntil) {
        const remainingTime = Math.ceil(
          (userLogin.lockUntil - new Date()) / (1000 * 60)
        );
        throw new apiError(429, `Account is locked. Try again in ${remainingTime} minutes.`);
      }

      let isCredentialValid = false;
      let usedCredentialType = credentialType;
      
      // Determine which credential to check
      // If PIN is not set, always use password
      if (!userLogin.pin) {
        // PIN not set - must use password
        isCredentialValid = await userLogin.comparePassword(String(credential));
        usedCredentialType = "password";
      } else if (credentialType === "pin") {
        // PIN is set and user trying to use PIN
        isCredentialValid = await userLogin.comparePin(String(credential));
      } else {
        // PIN is set but user trying password - allow either
        // Try password first
        isCredentialValid = await userLogin.comparePassword(String(credential));
        if (!isCredentialValid) {
          // Try PIN if password fails
          isCredentialValid = await userLogin.comparePin(String(credential));
          if (isCredentialValid) {
            usedCredentialType = "pin";
          }
        }
      }

      if (!isCredentialValid) {
        // Increment failed attempts
        userLogin.failedLoginAttempts = (userLogin.failedLoginAttempts || 0) + 1;

        // Progressive lock escalation based on failed attempts and current lock level
        if (userLogin.failedLoginAttempts >= 15 && userLogin.lockLevel >= 2) {
          // Permanent lock after 15 total failed attempts and already at level 2
          userLogin.isPermanentlyLocked = true;
          userLogin.lockLevel = 3;
        } else if (userLogin.failedLoginAttempts >= 10 && userLogin.lockLevel >= 1) {
          // 30-minute lock after 10 total failed attempts and already at level 1
          userLogin.lockLevel = 2;
          userLogin.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        } else if (userLogin.failedLoginAttempts >= 5) {
          // 15-minute lock after 5 failed attempts
          userLogin.lockLevel = 1;
          userLogin.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await userLogin.save();
        throw new apiError(401, `Invalid ${usedCredentialType}`);
      }

      // Reset failed attempts on successful reauth
      userLogin.failedLoginAttempts = 0;
      userLogin.lockLevel = 0;
      userLogin.lockUntil = null;
      userLogin.isLoggedIn = true;
      userLogin.lastLogin = new Date();
      userLogin.totalLoginCount = (userLogin.totalLoginCount || 0) + 1; // Increment total login count

      // Generate tokens
      const accessToken = userLogin.generateAccessToken(deviceId);
      const refreshToken = await userLogin.generateRefreshToken(
        deviceId,
        ipAddress,
        userAgent
      );

      // Fetch user details for response (exclude sensitive fields) and populate role
      const userResponse = await User.findById(userLogin.user)
        .select("-password")
        .populate("roleId");

      // Double-check login and active flags one more time before success
      if (!userResponse?.canLogin || !userResponse?.isActive) {
        throw new apiError(401, "Invalid login credentials");
      }

      let permissions = [];

      if (userResponse && Array.isArray(userResponse.permissions)) {
        permissions = [...userResponse.permissions];
      }

      if (userResponse?.roleId && Array.isArray(userResponse.roleId.permissionKeys)) {
        permissions = [
          ...permissions,
          ...userResponse.roleId.permissionKeys,
        ];
      }

      if (
        userResponse?.roleId &&
        userResponse.roleId.name === "super_admin" &&
        !permissions.includes("*")
      ) {
        permissions.push("*");
      }

      permissions = Array.from(new Set(permissions));

      return {
        success: true,
        user: userResponse,
        accessToken,
        refreshToken,
        permissions,
        forcePasswordChange: !!userLogin.forcePasswordChange,
        deviceId,
        message: "Re-authentication successful",
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Logout user from specific device
   * @param {string} userId - User ID from token
   * @param {string} deviceId - Device to logout from (optional)
   * @returns {Promise<Object>} - Success status and message
   */
  async logout(userId, deviceId) {
    try {
      const userLogin = await UserLogin.findOne({ user: userId });
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      // If deviceId is provided, logout from specific device only
      if (deviceId) {
        const logoutSuccess = await userLogin.logoutDevice(deviceId);
        if (!logoutSuccess) {
          throw new apiError(404, "Device not found or already logged out");
        }
      } else {
        // If no deviceId provided, logout from all devices
        await userLogin.logoutAllDevices();
      }

      // Check if any devices are still active
      const activeDevices = userLogin.loggedInDevices.filter(
        (d) => d.refreshToken !== null
      );
      if (activeDevices.length === 0) {
        userLogin.isLoggedIn = false;
      }

      await userLogin.save();

      return {
        success: true,
        message: deviceId ? "Device logout successful" : "All devices logout successful",
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Logout from all devices
   * @param {string} userId - User ID from token
   * @returns {Promise<Boolean>} - Success status
   */
  async logoutAllDevices(userId) {
    try {
      const userLogin = await UserLogin.findOne({ user: userId });
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      await userLogin.logoutAllDevices();
      userLogin.isLoggedIn = false;
      await userLogin.save();

      return {
        success: true,
        message: "Logged out from all devices",
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} - New access token and refresh token
   */
  async refreshTokens(refreshToken, deviceId) {
    try {
      // Verify refresh token signature
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || "REFRESH_TOKEN_DEFAULT"
      );

      // Find userLogin by referenced user id (refresh token payload contains user id)
      const userLogin = await UserLogin.findOne({ user: decoded.id });
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      // Resolve deviceId if not provided by client
      let effectiveDeviceId = deviceId;
      if (!effectiveDeviceId || effectiveDeviceId === "unknown") {
        // Try to derive deviceId from stored refreshTokens
        if (Array.isArray(userLogin.refreshTokens)) {
          const rt = userLogin.refreshTokens.find((rt) => rt.token === refreshToken);
          if (rt?.deviceId) {
            effectiveDeviceId = rt.deviceId;
          }
        }
        // Fallback: try from loggedInDevices
        if (!effectiveDeviceId && Array.isArray(userLogin.loggedInDevices)) {
          const dev = userLogin.loggedInDevices.find((d) => d.refreshToken === refreshToken);
          if (dev?.deviceId) {
            effectiveDeviceId = dev.deviceId;
          }
        }
      }

      // Verify token belongs to the resolved device
      const isValidToken = userLogin.verifyRefreshTokenForDevice(
        refreshToken,
        effectiveDeviceId
      );
      if (!isValidToken) {
        throw new apiError(401, "Invalid refresh token for this device");
      }

      // Generate new tokens
      const newAccessToken = userLogin.generateAccessToken(effectiveDeviceId);
      const newRefreshToken = await userLogin.generateRefreshToken(effectiveDeviceId);

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        message: "Tokens refreshed successfully",
      };
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new apiError(401, "Refresh token has expired. Please login again.");
      }
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Get all active devices for a user
   * @param {string} userId - User ID from token
   * @returns {Promise<Array>} - List of active devices
   */
  async getActiveDevices(userId) {
    try {
      const userLogin = await UserLogin.findOne({ user: userId });
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      return {
        success: true,
        devices: userLogin.getActiveDevices(),
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Revoke refresh token
   * @param {string} userId - User ID from token
   * @param {string} token - Token to revoke
   * @returns {Promise<Boolean>} - Success status
   */
  async revokeToken(userId, token) {
    try {
      const userLogin = await UserLogin.findOne({ user: userId });
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      const revoked = await userLogin.revokeRefreshToken(token);
      if (!revoked) {
        throw new apiError(404, "Token not found");
      }

      return {
        success: true,
        message: "Token revoked successfully",
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Set PIN for user
   * @param {string} userId - User ID
   * @param {string} pin - PIN (4-6 digits)
   * @returns {Promise<Object>} - Success status
   */
  async setPin(userId, pin) {
    try {
      // Validate PIN using password policy
      validatePINPolicy(pin);

      const userLogin = await UserLogin.findOne({ user: userId }).select("+password +pin");
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      // Set PIN (will be hashed in pre-save hook)
      userLogin.pin = String(pin).trim();
      await userLogin.save();

      return {
        success: true,
        message: "PIN set successfully",
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Update PIN for user
   * @param {string} userId - User ID
   * @param {string} oldPin - Current PIN
   * @param {string} newPin - New PIN (4-6 digits)
   * @returns {Promise<Object>} - Success status
   */
  async updatePin(userId, oldPin, newPin) {
    try {
      // Validate new PIN using password policy
      validatePINPolicy(newPin);

      const userLogin = await UserLogin.findOne({ user: userId }).select("+pin");
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      if (!userLogin.pin) {
        throw new apiError(400, "PIN is not set. Use Set PIN instead");
      }

      // Verify old PIN
      const isPinValid = await userLogin.comparePin(String(oldPin).trim());
      if (!isPinValid) {
        throw new apiError(401, "Current PIN is incorrect");
      }

      // Update PIN (will be hashed in pre-save hook)
      userLogin.pin = String(newPin).trim();
      await userLogin.save();

      return {
        success: true,
        message: "PIN updated successfully",
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Check if user has PIN set
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Object with isPinSet boolean
   */
  async checkPinStatus(userId) {
    try {
      const userLogin = await UserLogin.findOne({ user: userId }).select("+pin").lean();
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      return {
        success: true,
        isPinSet: !!userLogin.pin,
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Lock user account
   * @param {string} userId - User ID to lock
   * @param {string} reason - Reason for locking
   * @returns {Promise<Boolean>} - Success status
   */
  async lockAccount(userId, reason = "Manual lock by admin") {
    try {
      const userLogin = await UserLogin.findOne({ user: userId });
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      userLogin.isPermanentlyLocked = true;
      userLogin.isLoggedIn = false;
      await userLogin.logoutAllDevices();
      await userLogin.save();

      return {
        success: true,
        message: `Account locked. Reason: ${reason}`,
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Unlock user account
   * @param {string} userId - User ID to unlock
   * @returns {Promise<Boolean>} - Success status
   */
  async unlockAccount(userId) {
    try {
      const userLogin = await UserLogin.findOne({ user: userId });
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      userLogin.isPermanentlyLocked = false;
      userLogin.failedLoginAttempts = 0;
      userLogin.lockLevel = 0;
      userLogin.lockUntil = null;
      await userLogin.save();

      return {
        success: true,
        message: "Account unlocked successfully",
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Old password
   * @param {string} newPassword - New password
   * @returns {Promise<Boolean>} - Success status
   */
  async changePassword(userId, oldPassword, newPassword, ipAddress = null, userAgent = null, deviceId = null) {
    try {
      const userLogin = await UserLogin.findOne({ user: userId }).select(
        "+password"
      );
      if (!userLogin) {
        throw new apiError(404, "User not found");
      }

      // Verify old password (coerce to string to avoid bcrypt type errors)
      const isPasswordValid = await userLogin.comparePassword(String(oldPassword));
      if (!isPasswordValid) {
        throw new apiError(401, "Current password is incorrect");
      }

      const user = await User.findById(userId).select("organizationId userId name email personalEmail").lean();
      let orgPolicy = null;
      if (user?.organizationId) {
        const org = await Organization.findById(user.organizationId).select("enabledFeatures settings").lean();
        const enabled = Array.isArray(org?.enabledFeatures) ? org.enabledFeatures : [];
        const policy = org?.settings?.passwordPolicy;
        if (enabled.includes("PASSWORD_POLICY") && policy?.enabled) {
          orgPolicy = policy;
        }
      }

      let normalizedPassword = "";
      try {
        const policyResult = await validatePasswordPolicy({
          password: newPassword,
          user,
          userLogin,
          orgPolicy,
          enforceCooldown: true,
        });
        normalizedPassword = policyResult.normalizedPassword;
      } catch (err) {
        throw new apiError(400, err.message);
      }

      // Store previous password hash for audit
      const previousPasswordHash = userLogin.password;

      // Update password and reset PIN
      userLogin.password = normalizedPassword;
      userLogin.pin = null; // Reset PIN when password is changed
      await userLogin.save();

      // Record password change in audit trail
      await userLogin.recordPasswordChange({
        ipAddress,
        userAgent,
        deviceId,
        changedBy: "Self",
        changedByUserId: userId,
        changedByUsername: userLogin.username,
        changeType: "SelfInitiated",
        method: "DirectChange",
        previousPasswordHash,
        mfaVerified: false,
      });

      // Logout from all devices after password change (security)
      await userLogin.logoutAllDevices();
      userLogin.isLoggedIn = false;
      await userLogin.save();

      return {
        success: true,
        message:
          "Password changed successfully. Please login again with new password.",
      };
    } catch (error) {
      if (error instanceof apiError) throw error;
      throw new apiError(500, error.message);
    }
  },

  /**
   * Validate access token
   * @param {string} token - Access token
   * @returns {Promise<Object>} - Decoded token
   */
  async validateAccessToken(token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET || "ACCESS_TOKEN_DEFAULT"
      );
      return {
        success: true,
        data: decoded,
      };
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new apiError(401, "Access token has expired");
      }
      throw new apiError(401, "Invalid access token");
    }
  },
};

export default authService;
