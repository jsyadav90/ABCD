import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Role } from "../models/role.model.js";
import { getModuleForPermission, getPermissionKeyFromFullPermission } from "../constants/modulePermissionsMap.js";

/**
 * Permission Middleware
 * Description: Role aur user-specific permission keys merge karke authorize karta hai.
 * @param {string} requiredPermission - jis key ka access chahiye (e.g., "assets:inventory:view")
 */
export const verifyPermission = (requiredPermission) => {
  return asyncHandler(async (req, res, next) => {
    // 1. Ensure user is authenticated
    if (!req.user) {
      throw new apiError(401, "Unauthorized request: User not authenticated");
    }

    // 2. Check for super_admin role (bypass all checks)
    const roleName = req.user.role || req.user.roleId?.name;
    
    if (roleName === "super_admin") {
      return next();
    }

    // 3. Resolve permission keys from:
    // - rolePermissionKeys attached by verifyJWT
    // - userPermissionKeys (user-specific extra)
    // - removedPermissions (permissions to remove from role)
    // - fallback: fetch role by id
    let roleKeys = Array.isArray(req.user.rolePermissionKeys) ? req.user.rolePermissionKeys : [];
    let userKeys = Array.isArray(req.user.userPermissionKeys) ? req.user.userPermissionKeys : [];
    let removedKeys = Array.isArray(req.user.removedPermissions) ? req.user.removedPermissions : [];
    
    // DEBUG: Log what we're getting
    console.log(`Ÿ” PERMISSION CHECK DEBUG:`);
    console.log(`   User: ${req.user.userId || req.user.id}`);
    console.log(`   Role: ${roleName}`);
    console.log(`   Required: ${requiredPermission}`);
    console.log(`   roleKeys length: ${roleKeys.length}`);
    console.log(`   userKeys length: ${userKeys.length}`);
    console.log(`   removedKeys length: ${removedKeys.length}`);
    console.log(`   roleKeys includes required: ${roleKeys.includes(requiredPermission)}`);
    
    if (roleKeys.length === 0 && req.user.roleId) {
      try {
        const roleDoc = await Role.findById(req.user.roleId).select("permissionKeys name");
        console.log(`   â„¹ï¸ Fetched from DB: ${roleDoc?.name}, permissions: ${roleDoc?.permissionKeys?.length || 0}`);
        if (roleDoc && Array.isArray(roleDoc.permissionKeys)) {
          roleKeys = roleDoc.permissionKeys;
        }
      } catch (e) {
        console.log(`DB lookup failed: ${e.message}`);
      }
    }
    
    const permissions = Array.from(new Set([...roleKeys, ...userKeys].filter(p => !removedKeys.includes(p))));
    console.log(`   Final permissions: ${permissions.length}`);
    console.log(`   Has required: ${permissions.includes(requiredPermission) ? '[OK] YES' : '[X] NO'}`);

    // 4. Check if user has the required permission
    if (!permissions.includes(requiredPermission)) {
      throw new apiError(403, `Access denied. You do not have permission to perform this action. Required: ${requiredPermission}`);
    }

    // NEW: 5. Check if user's assigned modules include the required module
    const permissionKey = getPermissionKeyFromFullPermission(requiredPermission);
    const requiredModule = getModuleForPermission(permissionKey);
    
    if (requiredModule) {
      const userModules = req.user.modules || [];
      console.log(`   Module Check: Permission "${requiredPermission}" requires module "${requiredModule}"`);
      console.log(`   User modules: ${userModules.join(", ") || "NONE"}`);
      
      if (!userModules.includes(requiredModule)) {
        throw new apiError(
          403, 
          `Access denied. Module access required. You don't have access to module "${requiredModule}". ` +
          `Your modules: ${userModules.length > 0 ? userModules.join(", ") : "NONE"}`
        );
      }
      console.log(`   Module check: [OK] User has required module`);
    }

    next();
  });
};
