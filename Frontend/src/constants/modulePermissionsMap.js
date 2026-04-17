/**
 * Frontend Module & Permissions Mapping
 * 
 * ⚠️  AUTO-GENERATED - Do NOT edit manually
 * 
 * This is generated from navigationConfig.js which is the single source of truth.
 * To change which pages are in which modules, edit navigationConfig.js instead.
 * 
 * Maps modules to their associated permission keys.
 * Used to validate that a user has access to a module before allowing page access.
 */

import { generateModulePermissionsMap } from './navigationConfig';

// Auto-generate the mapping from navigation config
export const MODULE_PERMISSIONS_MAP = generateModulePermissionsMap();

/**
 * Get all permission keys (sub-modules) associated with given modules
 * @param {string[]} modules - Array of module IDs (e.g., ["module_1", "module_2"])
 * @returns {string[]} Array of permission keys that belong to these modules
 */
export const getPermissionsForModules = (modules) => {
  if (!Array.isArray(modules)) return [];
  
  return modules
    .flatMap(moduleId => MODULE_PERMISSIONS_MAP[moduleId] || [])
    .filter(Boolean);
};

/**
 * Get the module ID that a permission/sub-module belongs to
 * @param {string} permissionKey - Permission key (e.g., "assets", "users", "setup")
 * @returns {string|null} Module ID (e.g., "module_1") or null if not found
 */
export const getModuleForPermission = (permissionKey) => {
  for (const [moduleId, permissions] of Object.entries(MODULE_PERMISSIONS_MAP)) {
    if (permissions.includes(permissionKey)) {
      return moduleId;
    }
  }
  return null;
};

/**
 * Extract permission key from a full permission string
 * E.g., "assets:access" → "assets", "users:edit" → "users"
 * @param {string} fullPermission - Full permission string (e.g., "assets:access", "users:edit")
 * @returns {string} Permission/sub-module key (e.g., "assets")
 */
export const getPermissionKeyFromFullPermission = (fullPermission) => {
  if (!fullPermission || typeof fullPermission !== "string") {
    return null;
  }
  const parts = fullPermission.split(":");
  return parts[0]; // Return the part before the colon
};
