/**
 * Users Controller
 * 
 * Logics:
 * - isInReportingChain(targetUserId, managerUserId):
 *   Checks upward reporting chain to see if target reports (directly/indirectly) to manager.
 * - createUser(req, res):
 *   Validates input, atomically increments organization's userSequence (with configurable start/prefix),
 *   generates immutable seqId and userId, assigns branches/role, creates user.
 * - getUserById(req, res):
 *   Fetches a user by id with role and branch population, and enforces access/visibility.
 * - listUsers(req, res):
 *   Server-side pagination, role/active filters, search, and strict branch-based visibility:
 *   non-‘super users only see users whose branchId overlaps with their branches; if no branches, only self.
 * - updateUser(req, res):
 *   Updates general fields (not canLogin/isActive), enforcing access.
 * - toggleCanLogin(req, res):
 *   Enables/disables login; when enabling, creates credentials with username = user.userId.
 * - toggleIsActive(req, res):
 *   Activates/deactivates user; deactivation also disables login.
 * - changeUserRole(req, res):
 *   Changes role by id or role name.
 * - softDeleteUser / restoreUser / deleteUserPermanent:
 *   Account lifecycle operations with minimal side effects.
 * - getRolesForDropdown / getBranchesForDropdown / getUsersForDropdown:
 *   Provides dropdown datasets for UI forms with necessary scoping.
 * - getNextUserId(req, res):
 *   Returns a non-mutating preview of the next userId for the given organization.
 */

import { User } from "../models/user.model.js";
import { Role } from "../models/role.model.js";
import { Branch } from "../models/branch.model.js"; 
import { UserLogin } from "../models/userLogin.model.js";
import { Organization } from "../models/organization.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { getPermissionsForModules, getRemovedModules, getAddedModules } from "../constants/modulePermissionsMap.js";
import { validatePasswordPolicy } from "../utils/passwordPolicy.js";

// =====================================================
// HELPER FUNCTION: Check hierarchical access (reporting chain)
// =====================================================
const isInReportingChain = async (targetUserId, managerUserId, maxDepth = 20) => {
  if (!targetUserId || !managerUserId) return false;
  let currentId = targetUserId;
  let depth = 0;
  // Traverse reportingTo upwards until null or maxDepth
  while (currentId && depth < maxDepth) {
    const doc = await User.findById(currentId).select("reportingTo").lean();
    if (!doc || !doc.reportingTo) break;
    if (String(doc.reportingTo) === String(managerUserId)) return true;
    currentId = doc.reportingTo;
    depth += 1;
  }
  return false;
};

const createUserLoginCredentials = async (userId, userName, providedLoginId = null) => {
  try {
    const defaultPlain = process.env.DEFAULT_PASSWORD || "12345678";
    let baseUsername = null;

    if (providedLoginId) {
      baseUsername = String(providedLoginId).toLowerCase().trim();
      const existing = await UserLogin.findOne({ username: baseUsername });
      if (existing) {
        throw new apiError(409, "Login ID already exists");
      }
      const login = new UserLogin({
        user: userId,
        username: baseUsername,
        password: defaultPlain,
        forcePasswordChange: true,
      });
      await login.save();
      return { success: true, username: baseUsername, login };
    } else if (userName) {
      const parts = userName.trim().toLowerCase().split(/\s+/);
      if (parts.length === 1) baseUsername = parts[0];
      else baseUsername = `${parts[0]}.${parts[parts.length - 1]}`;
    } else {
      baseUsername = String(userId).toLowerCase();
    }

    // sanitize username (allow alphanum and dots and @ and - _)
    baseUsername = baseUsername.replace(/[^a-z0-9@._\-]/g, "");

    // Check for existing username and add numeric suffix if needed
    let username = baseUsername;
    let suffix = 0;
    while (await UserLogin.findOne({ username })) {
      suffix += 1;
      username = `${baseUsername}${suffix}`;
    }

    // Create UserLogin with hashed password
    const login = new UserLogin({
      user: userId,
      username,
      password: defaultPlain,
      forcePasswordChange: true,
    });

    await login.save();
    return { success: true, username, login };
  } catch (error) {
    throw new apiError(500, `Failed to create login credentials: ${error.message}`);
  }
};

const hasUserAccess = async (reqUser, targetUser) => {
  const roleName = (reqUser?.role || "").replace(/ /g, "_");
  const isSuper = roleName === "super_admin";
  if (isSuper) return true;
  if (!targetUser) return false;

  // Self access
  if (String(targetUser._id) === String(reqUser._id)) return true;

  // Hierarchy access (any level of reporting)
  if (await isInReportingChain(targetUser._id, reqUser._id)) return true;

  // Branch overlap access (any intersection)
  const reqBranchIds = Array.isArray(reqUser?.branchId)
    ? reqUser.branchId.map((b) => (typeof b === "object" && b?._id ? String(b._id) : String(b)))
    : [];
  const targetIds = Array.isArray(targetUser?.branchId)
    ? targetUser.branchId.map((b) => (typeof b === "object" && b?._id ? String(b._id) : String(b)))
    : [];
  if (reqBranchIds.length > 0 && targetIds.some((id) => reqBranchIds.includes(String(id)))) {
    return true;
  }

  return false;
};

// Controller function names:
// - createUser
// - getUserById
// - listUsers
// - updateUser
// - toggleCanLogin
// - toggleIsActive
// - changeUserRole
// - softDeleteUser
// - restoreUser
// - deleteUserPermanent

export const createUser = asyncHandler(async (req, res) => {
  const payload = req.body;

  const orgId = payload.organizationId || req.user?.organizationId || null;

  if (!payload.name || !orgId) {
    console.error('âŒ Missing required fields');
    throw new apiError(400, "name and organizationId are required");
  }

  if (!payload.gender || !["Male", "Female", "Other"].includes(payload.gender)) {
    throw new apiError(400, "gender is required and must be one of: Male, Female, Other");
  }

  // Atomically bump userSequence respecting configurable start (settings.userIdSequenceStart, default 21000)
  // Use MongoDB pipeline update in a single findOneAndUpdate call for thread-safety.
  const org = await Organization.findOneAndUpdate(
    { _id: orgId },
    [
      { $set: { settings: { $ifNull: ["$settings", {}] } } },
      {
        $set: {
          userSequence: {
            $cond: [
              { $lt: ["$userSequence", { $ifNull: ["$settings.userIdSequenceStart", 21000] }] },
              { $add: [{ $ifNull: ["$settings.userIdSequenceStart", 21000] }, 1] },
              { $add: ["$userSequence", 1] }
            ]
          }
        }
      }
    ],
    { new: true, projection: { userSequence: 1, settings: 1 }, updatePipeline: true }
  );

  if (!org) {
    throw new apiError(404, "Organization not found");
  }

  const seqId = org.userSequence;
  const prefix = (org.settings && typeof org.settings.userIdPrefix === "string" && org.settings.userIdPrefix.trim())
    ? org.settings.userIdPrefix.trim()
    : "U";
  const generatedUserId = `${prefix}${String(seqId)}`;

  const assignedBranches = Array.isArray(payload.assignedBranches)
    ? payload.assignedBranches
    : Array.isArray(payload.branchId)
    ? payload.branchId
    : [];
  const primaryBranchId = payload.primaryBranchId || (assignedBranches.length > 0 ? assignedBranches[0] : null);

  // Prevent client from forcing fields we manage server-side
  const toCreate = {
    userId: generatedUserId,
    seqId,
    name: payload.name,
    designation: payload.designation || "NA",
    department: payload.department || "NA",
    gender: payload.gender,
    dob: payload.dob ? new Date(payload.dob) : (payload.dateOfBirth ? new Date(payload.dateOfBirth) : null),
    dateOfJoining: payload.dateOfJoining ? new Date(payload.dateOfJoining) : null,
    email: payload.email || null,
    personalEmail: payload.personalEmail || null,
    phone_no: payload.phone_no || null,
    roleId: null,
    permissions: [],
    reportingTo: payload.reportingTo || null,
    organizationId: orgId,
    branchId: assignedBranches,
    primaryBranchId,
    assignedBranches,
    canLogin: false,
    isActive: payload.isActive !== false,
    isBlocked: payload.isBlocked === true,
    remarks: payload.remarks != null && payload.remarks !== '' ? String(payload.remarks).trim() : '',
    createdBy: payload.createdBy || null,
  };

  // Assign default "user" role
  try {
    const userRole = await Role.findOne({ name: "user", isDeleted: false });
    if (userRole) {
      toCreate.roleId = userRole._id;
    } else {
      // Fallback: try to find any role if "user" not found (should not happen if seeded)
      console.warn("âš ï¸ Default 'user' role not found, assigning first available role");
      const anyRole = await Role.findOne({ isDeleted: false }).sort({ priority: 1 });
      if (anyRole) toCreate.roleId = anyRole._id;
    }
  } catch (err) {
    console.error("âŒ Failed to assign default role:", err);
  }

  const user = await User.create({
    ...toCreate,
    inactiveReason: [],
  });

  // canLogin is always false on creation now, so no need to create credentials here.
  // Admin must enable login explicitly later.

  return res.status(201).json(new apiResponse(201, user, "User created successfully"));
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userDoc = await User.findById(id).populate('roleId branchId').lean();
  
  if (!userDoc) {
    throw new apiError(404, "User not found");
  }
  
  const targetUserForAccess = await User.findById(id).select("branchId reportingTo").lean();
  if (!(await hasUserAccess(req.user, { ...targetUserForAccess, _id: id }))) {
    throw new apiError(404, "User not found");
  }

  const roleModules = Array.isArray(userDoc.roleId?.modules) ? userDoc.roleId.modules : [];
  const userModules = Array.isArray(userDoc.modules) ? userDoc.modules : [];
  const removedModules = Array.isArray(userDoc.removedModules) ? userDoc.removedModules : [];
  const effectiveModules = Array.from(new Set([...roleModules, ...userModules])).filter(
    (moduleKey) => !removedModules.includes(moduleKey)
  );

  const user = {
    ...userDoc,
    role: userDoc.roleId?.displayName || userDoc.roleId?.name || null,
    modules: effectiveModules,
  };

  return res.status(200).json(new apiResponse(200, user, "User retrieved successfully"));
});

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || 1, 10), 1);
  const limit = Math.max(parseInt(req.query.limit || 25, 10), 1);
  const skip = (page - 1) * limit;

  const filter = {};
  // Support filtering by role name or roleId
  if (req.query.role) {
    const roleQuery = req.query.role;
    // If looks like an ObjectId, use directly
    if (/^[0-9a-fA-F]{24}$/.test(roleQuery)) {
      filter.roleId = roleQuery;
    } else {
      const found = await Role.findOne({ name: roleQuery, isDeleted: false }).select("_id");
      if (found) filter.roleId = found._id;
    }
  }
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
  if (req.query.canLogin !== undefined) filter.canLogin = req.query.canLogin === "true";
  if (req.query.organizationId) filter.organizationId = req.query.organizationId;

  // Branch scope: non-super users should ONLY see users whose branches are a subset of the viewer's branches
  const roleName = String(req.user?.role || "").toLowerCase();
  const isSuper = roleName === "super_admin" || roleName === "super admin";
  const isEnterprise = roleName === "enterprise_admin" || roleName === "enterprise admin";
  
  if (!isSuper) {
    // Restrict organization for non-super roles
    if (isEnterprise && req.user?.organizationId) {
      filter.organizationId = req.user.organizationId;
    } else {
      // Branch/Standard users: strictly subset branch visibility
      if (req.user?.organizationId) {
        filter.organizationId = req.user.organizationId;
      }
      const viewerBranches = Array.isArray(req.user?.branchId)
        ? req.user.branchId.map((b) => (b && b._id ? b._id : b))
        : [];

      if (viewerBranches.length === 0) {
        filter._id = req.user._id;
      } else {
        const branchOverlap = { branchId: { $in: viewerBranches } };
        if (filter.$and) filter.$and.push(branchOverlap);
        else filter.$and = [branchOverlap];
      }
    }
  }

  // Handle Search Query (merged with existing filter)
  if (req.query.q) {
    const q = req.query.q.trim();
    const searchCondition = {
      $or: [
        { name: new RegExp(q, "i") },
        { userId: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
        { personalEmail: new RegExp(q, "i") },
      ]
    };
    
    if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        searchCondition
      ];
      delete filter.$or;
    } else if (filter.$and) {
      filter.$and.push(searchCondition);
    } else {
      filter.$or = searchCondition.$or;
    }
  }

  const [itemsRaw, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).populate('roleId branchId').lean(),
    User.countDocuments(filter),
  ]);

  // Get UserLogin data for lock status
  const userIds = itemsRaw.map(u => u._id);
  const userLogins = await UserLogin.find({ user: { $in: userIds } }).select('user failedLoginAttempts lockLevel lockUntil isPermanentlyLocked').lean();
  const loginMap = new Map(userLogins.map(ul => [ul.user.toString(), ul]));

  // Map role name for compatibility with frontend which expects `role` string
  const items = itemsRaw.map((it) => {
    const loginData = loginMap.get(it._id.toString());
    const roleModules = Array.isArray(it.roleId?.modules) ? it.roleId.modules : [];
    const userModules = Array.isArray(it.modules) ? it.modules : [];
    const removedModules = Array.isArray(it.removedModules) ? it.removedModules : [];
    const effectiveModules = Array.from(new Set([...roleModules, ...userModules])).filter(
      (moduleKey) => !removedModules.includes(moduleKey)
    );

    return {
      ...it,
      role: it.roleId?.displayName || it.roleId?.name || null,
      effectiveModules: effectiveModules,
      // Add lock status information
      isLocked: loginData ? (loginData.isPermanentlyLocked || (loginData.lockUntil && new Date() < loginData.lockUntil)) : false,
      lockLevel: loginData?.lockLevel || 0,
      failedLoginAttempts: loginData?.failedLoginAttempts || 0,
    };
  });

  return res.status(200).json(new apiResponse(200, { items, meta: { page, limit, total } }, "Users retrieved successfully"));
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = { ...req.body };

  if (payload.roleId === "" || payload.roleId === null) {
    throw new apiError(400, "Role is required");
  }

  if (payload.branchId !== undefined) {
    if (!Array.isArray(payload.branchId) || payload.branchId.length === 0) {
      throw new apiError(400, "At least one branch must be selected");
    }
  }

  // Prevent direct overwrite of login-related flags without using specific endpoints
  delete payload.canLogin;
  delete payload.isActive;

  const existing = await User.findById(id).select('branchId').lean();
  if (!existing) {
    throw new apiError(404, "User not found");
  }
  const targetUserForAccess = await User.findById(id).select("branchId reportingTo").lean();
  if (!(await hasUserAccess(req.user, { ...targetUserForAccess, _id: id }))) {
    throw new apiError(403, "Forbidden");
  }

  const user = await User.findByIdAndUpdate(id, payload, { new: true }).populate('roleId branchId');
  
  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res.status(200).json(new apiResponse(200, user, "User updated successfully"));
});

// Toggle canLogin explicitly. Business rule: canLogin can only be true when isActive === true
export const toggleCanLogin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { enable, loginId } = req.body; // enable:boolean, loginId optional (userId/email/username)

  // User cannot change their own canLogin status
  if (req.user?.id && String(req.user.id) === String(id)) {
    throw new apiError(403, "You cannot change your own login status");
  }

  // Validate input
  if (enable === undefined || enable === null) {
    throw new apiError(400, "Enable flag is required (true/false)");
  }

  const user = await User.findById(id);
  
  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (!(await hasUserAccess(req.user, user))) {
    throw new apiError(403, "Forbidden");
  }

  // Check if user is active when trying to enable login
  if (enable && !user.isActive) {
    throw new apiError(400, `Cannot enable login for inactive user. User "${user.name}" must be active first. Please enable user status (isActive) before enabling login.`);
  }

  if (enable) {
    const hasRole = !!user.roleId;
    const hasBranch = Array.isArray(user.branchId)
      ? user.branchId.length > 0
      : !!user.branchId;

    if (!hasRole || !hasBranch) {
      const missing = [];
      if (!hasRole) missing.push("role");
      if (!hasBranch) missing.push("branch");
      throw new apiError(
        400,
        `Cannot enable login: user must have ${missing.join(" and ")} assigned.`
      );
    }

    // If a UserLogin already exists for this user, leave it
    let existingLogin = await UserLogin.findOne({ user: user._id });
    if (!existingLogin) {
      // Use helper to create UserLogin with username generation logic
      try {
        const enforcedLoginId = loginId || user.userId;
        const loginResult = await createUserLoginCredentials(user._id, user.name, enforcedLoginId);
      } catch (loginError) {
        console.error(`âŒ Failed to create login credentials:`, loginError.message);
        throw new apiError(500, `Failed to create login credentials: ${loginError.message}`);
      }
    }

    user.canLogin = true;
  } else {
    // disable login: keep UserLogin record intact, just set canLogin flag to false
    // This preserves login history and allows re-enabling later
    user.canLogin = false;
  }

  await user.save();
  
  // Fetch updated user to confirm changes
  const updatedUser = await User.findById(id);
  
  return res.status(200).json(new apiResponse(200, updatedUser, `Login ${enable ? "enabled" : "disabled"} successfully for user ${user.name}`));
});

// Toggle isActive. Business rule: when disabling isActive, also disable canLogin. Enabling isActive does NOT auto-enable canLogin.
export const toggleIsActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { enable, inactiveReason } = req.body; // boolean + reason

  if (typeof enable !== 'boolean') {
    throw new apiError(400, "enable must be a boolean value");
  }

  if (!inactiveReason || typeof inactiveReason !== 'string' || inactiveReason.trim() === '') {
    throw new apiError(400, "Reason is required for status change");
  }

  // User cannot change their own isActive status
  if (req.user?.id && String(req.user.id) === String(id)) {
    throw new apiError(403, "You cannot change your own active status");
  }

  const user = await User.findById(id);
  
  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (!(await hasUserAccess(req.user, user))) {
    throw new apiError(403, "Forbidden");
  }

  if (!Array.isArray(user.inactiveReason)) {
    user.inactiveReason = user.inactiveReason ? [
      {
        reason: String(user.inactiveReason),
        status: !enable,
        changedAt: user.inactiveAt || new Date(),
        changedBy: user.inactiveBy || null,
      }
    ] : [];
  }

  user.inactiveReason.push({
    reason: inactiveReason.trim(),
    status: enable,
    changedAt: new Date(),
    changedBy: req.user._id,
  });

  if (enable) {
    user.isActive = true;
    // do not change canLogin automatically
    user.inactiveAt = null;
    user.inactiveBy = null;
  } else {
    user.isActive = false;
    user.canLogin = false;
    user.inactiveAt = new Date();
    user.inactiveBy = req.user._id;
  }

  await user.save();
  return res.status(200).json(new apiResponse(200, user, `User ${enable ? "activated" : "deactivated"} successfully`));
});

export const changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roleId, role, extraPermissions, removedPermissions, extraModules, removedModules } = req.body;

  const user = await User.findById(id);
  
  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (!(await hasUserAccess(req.user, user))) {
    throw new apiError(403, "Forbidden");
  }

  const oldRoleId = user.roleId ? String(user.roleId) : null;
  let newRoleId = oldRoleId;
  let roleChanged = false;

  if (roleId) {
    newRoleId = String(roleId);
    const found = await Role.findById(roleId);
    if (!found || found.isDeleted) {
      throw new apiError(400, "Role not found");
    }
    if (!found.isActive) {
      throw new apiError(400, "Cannot assign an inactive role");
    }
    user.roleId = roleId;
    roleChanged = oldRoleId !== newRoleId;
  } else if (role) {
    // If role name provided, try to resolve to roleId
    const found = await Role.findOne({ name: role, isDeleted: false });
    if (!found) {
      throw new apiError(400, "Role not found by name");
    }
    if (!found.isActive) {
      throw new apiError(400, "Cannot assign an inactive role");
    }
    newRoleId = String(found._id);
    user.roleId = found._id;
    roleChanged = oldRoleId !== newRoleId;
  }

  // If role changed, handle module and permission overrides
  // User gets only default modules and permissions from new role
  // But remove extraPermissions related to modules that were removed from the role
  if (roleChanged) {
    // Get old and new role modules
    let oldRoleModules = [];
    let newRoleModules = [];
    
    if (oldRoleId) {
      const oldRole = await Role.findById(oldRoleId).select("modules");
      oldRoleModules = oldRole ? oldRole.modules || [] : [];
    }
    
    const newRole = await Role.findById(newRoleId).select("modules");
    newRoleModules = newRole ? newRole.modules || [] : [];
    
    // Find removed modules
    const removedModulesFromRole = getRemovedModules(oldRoleModules, newRoleModules);
    
    // Get permissions for removed modules
    const permissionsToRemove = getPermissionsForModules(removedModulesFromRole);
    
    // Remove extraPermissions that belong to removed modules
    user.extraPermissions = user.extraPermissions.filter(perm => {
      const permKey = perm.split(':')[0]; // Extract permission key (e.g., "assets" from "assets:inventory:view")
      return !permissionsToRemove.includes(permKey);
    });
    
    // Clear other role-specific overrides
    user.removedPermissions = [];
    user.modules = [];
    user.removedModules = [];
  } else {
    // If role NOT changed, allow updates to individual permissions/modules
    if (Array.isArray(extraPermissions)) {
      user.extraPermissions = extraPermissions;
    }
    if (Array.isArray(removedPermissions)) {
      user.removedPermissions = removedPermissions;
    }
    if (Array.isArray(extraModules)) {
      // Before updating modules, remove permissions related to modules being removed
      const currentModules = user.modules || [];
      const removedModulesFromUser = getRemovedModules(currentModules, extraModules);
      const permissionsToRemove = getPermissionsForModules(removedModulesFromUser);
      
      // Remove from extraPermissions
      user.extraPermissions = user.extraPermissions.filter(perm => {
        const permKey = perm.split(':')[0];
        return !permissionsToRemove.includes(permKey);
      });
      
      // Remove from removedPermissions
      user.removedPermissions = user.removedPermissions.filter(perm => {
        const permKey = perm.split(':')[0];
        return !permissionsToRemove.includes(permKey);
      });
      
      user.modules = extraModules;
    }
    if (Array.isArray(removedModules)) {
      // Before updating removedModules, check for newly removed modules from role
      const currentRemovedModules = user.removedModules || [];
      const newlyRemovedModules = getRemovedModules(currentRemovedModules, removedModules); // Wait, no: getAddedModules would be better
      
      // Actually, since removedModules is the list of modules removed from role,
      // when removedModules is updated, if new modules are added to this list,
      // it means those modules are now removed from the role for this user.
      // So, we should remove extraPermissions for those newly removed modules.
      
      // But getRemovedModules(old, new) gives modules removed from old to new,
      // but here old is currentRemovedModules, new is removedModules,
      // if removedModules has more, then newly added are the ones not in old but in new.
      // So, getAddedModules(currentRemovedModules, removedModules)
      
      // I need to import getAddedModules
      const newlyRemovedFromRole = getAddedModules(currentRemovedModules, removedModules);
      const permissionsToRemove = getPermissionsForModules(newlyRemovedFromRole);
      
      // Remove from extraPermissions
      user.extraPermissions = user.extraPermissions.filter(perm => {
        const permKey = perm.split(':')[0];
        return !permissionsToRemove.includes(permKey);
      });
      
      // Remove from removedPermissions (though less likely)
      user.removedPermissions = user.removedPermissions.filter(perm => {
        const permKey = perm.split(':')[0];
        return !permissionsToRemove.includes(permKey);
      });
      
      user.removedModules = removedModules;
    }
  }

  await user.save();
  return res.status(200).json(new apiResponse(200, user, "User role updated successfully. Individual module and permission overrides cleared."));
});

export const softDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  
  if (!user) {
    throw new apiError(404, "User not found");
  }

  user.isActive = false;
  user.canLogin = false;
  user.isBlocked = true;
  // mark createdBy/updatedBy handled elsewhere
  await user.save();
  return res.status(200).json(new apiResponse(200, user, "User soft-deleted (deactivated) successfully"));
});

export const restoreUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  
  if (!user) {
    throw new apiError(404, "User not found");
  }

  user.isActive = true;
  // do not auto-enable canLogin
  user.isBlocked = false;
  await user.save();
  return res.status(200).json(new apiResponse(200, user, "User restored (activated) successfully"));
});

export const deleteUserPermanent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  
  if (!user) {
    throw new apiError(404, "User not found");
  }
  
  return res.status(200).json(new apiResponse(200, null, "User permanently deleted successfully"));
});

// Fetch all roles for dropdown (returns id, name, and displayName)
export const getRolesForDropdown = asyncHandler(async (req, res) => {
  try {
    // Fetch only active roles for dropdown lists
    let roles = await Role.find(
      { isDeleted: false, isActive: true },
      "name displayName description category permissionKeys modules"
    )
      .lean()
      .sort({ priority: -1 });

    if (!roles || roles.length === 0) {
      const totalRoleCount = await Role.countDocuments({ isDeleted: false });
      if (totalRoleCount === 0) {
        const Organization = (await import("../models/organization.model.js")).Organization;
        const UserModel = (await import("../models/user.model.js")).User;

        // Ensure organization exists
        let org = await Organization.findOne({ code: "ABCD" });
        if (!org) {
          org = await Organization.create({
            name: "ABCD",
            code: "ABCD",
            sortName: "ABCD",
            contactInfo: { primaryEmail: "abcd@local" },
            status: "ACTIVE",
          });
        }

        // Ensure a seed user exists to act as creator
        let seedUser = await UserModel.findOne({ userId: "seed-super-admin", organizationId: org._id });
        if (!seedUser) {
          seedUser = await UserModel.create({
            userId: "seed-super-admin",
            name: "Seed Super Admin",
            organizationId: org._id,
            canLogin: false,
            isActive: true,
          });
        }

        // Initialize system roles
        await Role.initializeSystemRoles(seedUser._id);

        // Re-fetch active roles
        roles = await Role.find(
          { isDeleted: false, isActive: true },
          "name displayName description category permissionKeys modules"
        )
          .lean()
          .sort({ priority: -1 });
      }
    }

    const formattedRoles = roles.map((role) => ({
      _id: role._id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissionKeys: Array.isArray(role.permissionKeys) ? role.permissionKeys : [],
      modules: Array.isArray(role.modules) ? role.modules : [],
    }));

    return res.status(200).json(new apiResponse(200, formattedRoles, "Roles retrieved successfully"));
  } catch (error) {
    console.error('âŒ Error in getRolesForDropdown:', error.message);
    throw new apiError(500, `Failed to fetch roles: ${error.message}`);
  }
});

// Fetch all branches for dropdown (returns id, name, code)
export const getBranchesForDropdown = asyncHandler(async (req, res) => {
  const { organizationId } = req.query;

  let filter = { status: "ACTIVE" };
  if (organizationId) {
    filter.organizationId = organizationId;
  }
  
  // Restrict branches to user's assigned branches unless super admin
  const isSuper = req.user?.role === "super_admin";
  const userBranchIds = Array.isArray(req.user?.branchId)
    ? req.user.branchId.map((b) => (typeof b === "object" && b?._id ? b._id : b))
    : [];
  if (!isSuper && userBranchIds.length === 0) {
    return res.status(200).json(new apiResponse(200, [], "No branches found"));
  }
  if (!isSuper && userBranchIds.length > 0) {
    filter._id = { $in: userBranchIds };
  }

  const branches = await Branch.find(filter, "branchName branchCode address").lean();
  
  if (!branches || branches.length === 0) {
    return res.status(200).json(new apiResponse(200, [], "No branches found"));
  }

  const formattedBranches = branches.map((branch) => ({
    _id: branch._id,
    name: branch.branchName,
    code: branch.branchCode,
    address: branch.address?.line1 || "",
  }));

  return res.status(200).json(new apiResponse(200, formattedBranches, "Branches retrieved successfully"));
});

// Fetch all users for dropdown (returns id, name, userId)
export const getUsersForDropdown = asyncHandler(async (req, res) => {
  const { organizationId, branchId } = req.query;

  let filter = { isActive: true, isBlocked: false };
  if (organizationId) {
    filter.organizationId = organizationId;
  }
  
  // If user is not super admin, apply branch/hierarchy restrictions
  const roleName = String(req.user?.role || "").toLowerCase();
  const isSuper = roleName === "super_admin" || roleName === "super admin";
  
  if (!isSuper) {
    if (req.user?.organizationId) {
      filter.organizationId = req.user.organizationId;
    }
    // Simple visibility for dropdown: show all active users in organization
    // Frontend can filter further if needed.
  }

  const users = await User.find(filter, "name userId designation").lean().sort({ name: 1 });
  
  const formattedUsers = users.map((u) => ({
    _id: u._id,
    name: u.name,
    userId: u.userId,
    designation: u.designation
  }));

  return res.status(200).json(new apiResponse(200, formattedUsers, "Users retrieved successfully"));
});

// Preview next userId without mutating sequence
export const getNextUserId = asyncHandler(async (req, res) => {
  const orgId = req.query.organizationId || req.user?.organizationId || null;
  if (!orgId) {
    throw new apiError(400, "organizationId is required");
  }
  const org = await Organization.findById(orgId).select("userSequence settings");
  if (!org) {
    throw new apiError(404, "Organization not found");
  }
  const start = (org.settings && Number.isFinite(Number(org.settings.userIdSequenceStart)))
    ? Number(org.settings.userIdSequenceStart)
    : 21000;
  const prefix = (org.settings && typeof org.settings.userIdPrefix === "string" && org.settings.userIdPrefix.trim())
    ? org.settings.userIdPrefix.trim()
    : "U";
  const nextNumeric = Math.max(org.userSequence || 0, start) + 1;
  const nextId = `${prefix}${nextNumeric}`;
  return res.status(200).json(new apiResponse(200, { nextId, nextNumeric, prefix, start }, "Next userId preview"));
});

// Change user password
export const changeUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  console.log('Ÿ” changeUserPassword called for userId:', id);

  if (!newPassword || !String(newPassword).trim()) {
    throw new apiError(400, "newPassword is required");
  }

  // Find user
  const user = await User.findById(id);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const orgId = user.organizationId;
  let orgPolicy = null;
  if (orgId) {
    const org = await Organization.findById(orgId).select("enabledFeatures settings").lean();
    const enabled = Array.isArray(org?.enabledFeatures) ? org.enabledFeatures : [];
    const policy = org?.settings?.passwordPolicy;
    if (enabled.includes("PASSWORD_POLICY") && policy?.enabled) {
      orgPolicy = policy;
    }
  }

  // Check if user has login credentials
  let userLogin = await UserLogin.findOne({ user: id }).select("+password");
  if (!userLogin) {
    throw new apiError(400, "User does not have login credentials. Enable login first.");
  }

  let normalizedPassword = "";
  try {
    const policyResult = await validatePasswordPolicy({
      password: newPassword,
      user,
      userLogin,
      orgPolicy,
      enforceCooldown: false,
    });
    normalizedPassword = policyResult.normalizedPassword;
  } catch (err) {
    throw new apiError(400, err.message);
  }

  // Extract IP and user agent from request
  const ipAddress = req.ip || req.connection?.remoteAddress || req.headers["x-forwarded-for"] || "Unknown";
  const userAgent = req.headers["user-agent"] || "Unknown";
  const adminId = req.user?.id; // Current logged in admin
  const adminUsername = req.user?.username;

  // Store previous password hash for audit
  const previousPasswordHash = userLogin.password;

  // Update password in UserLogin model
  userLogin.password = normalizedPassword;
  userLogin.forcePasswordChange = false; // User has now changed password
  await userLogin.save();

  // Record password change in audit trail (Admin changed it)
  await userLogin.recordPasswordChange({
    ipAddress,
    userAgent,
    changedBy: "Admin",
    changedByUserId: adminId,
    changedByUsername: adminUsername,
    changeType: "AdminPasswordSet",
    method: "AdminPanel",
    reason: "Password reset by administrator",
    previousPasswordHash,
    mfaVerified: false,
  });

  console.log('[OK] Password changed successfully for user:', user.name);

  return res.status(200).json(new apiResponse(200, { success: true, message: `Password changed for ${user.name}` }, "Password changed successfully"));
});

// Note: Named exports are used by routes; default export removed to avoid ESM interop issues.
