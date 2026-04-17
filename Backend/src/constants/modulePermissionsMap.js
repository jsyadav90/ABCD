/**
 * Module & Permissions Mapping
 * 
 * Maps modules to their associated permission keys (sub-modules).
 * When a module is removed from a role, all its associated permissions are also removed.
 */

export const MODULE_PERMISSIONS_MAP = {
  module_1: [
    "assets",
    "users",
    "upgrades",
    "reports",
    "setup"
  ],
  module_2: [
    "endpoints"
  ],
};

/**
 * Get all permission keys associated with given modules
 * @param {string[]} modules - Array of module IDs (e.g., ["module_1", "module_2"])
 * @returns {string[]} Array of permission keys that belong to these modules
 */
export const getPermissionsForModules = (modules) => {
  if (!Array.isArray(modules)) return [];
  
  return modules
    .flatMap(moduleId => MODULE_PERMISSIONS_MAP[moduleId] || [])
    .filter(Boolean); // Remove any undefined/null values
};

/**
 * Get modules that have been removed
 * @param {string[]} oldModules - Previous module array
 * @param {string[]} newModules - New module array
 * @returns {string[]} Array of module IDs that were removed
 */
export const getRemovedModules = (oldModules, newModules) => {
  if (!Array.isArray(oldModules)) oldModules = [];
  if (!Array.isArray(newModules)) newModules = [];
  
  return oldModules.filter(m => !newModules.includes(m));
};

/**
 * Get modules that have been added
 * @param {string[]} oldModules - Previous module array
 * @param {string[]} newModules - New module array
 * @returns {string[]} Array of module IDs that were added
 */
export const getAddedModules = (oldModules, newModules) => {
  if (!Array.isArray(oldModules)) oldModules = [];
  if (!Array.isArray(newModules)) newModules = [];
  
  return newModules.filter(m => !oldModules.includes(m));
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
