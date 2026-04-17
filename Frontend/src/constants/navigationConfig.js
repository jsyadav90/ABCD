/**
 * Centralized Navigation & Module Configuration
 * 
 * Single source of truth for:
 * - Which pages are in which modules
 * - Permissions mapping
 * - Sidebar menu items
 * 
 * Everything else (routes, permissions map, etc.) is auto-generated from this config.
 * If you need to add a page to a module or change accessibility, edit this file only.
 */

export const PAGES_CONFIG = [
  {
    key: "users",
    label: "User",
    icon: "people",
    path: "/users",
    permission: "users",
    modules: ["module_1"],
  },
  {
    key: "assets",
    label: "Asset",
    icon: "inventory_2",
    path: "/assets",
    permission: "assets",
    modules: ["module_1"],
  },
  {
    key: "upgrades",
    label: "Upgrade",
    icon: "assignment",
    path: "/requests",
    permission: "upgrades",
    modules: ["module_1"],
  },
  {
    key: "issueTo",
    label: "Issue To",  
    icon: "assignment",
    path: "/requests",
    permission: "issueTo",
    modules: ["module_1"],
  },
  {
    key: "reports",
    label: "Report",
    icon: "bar_chart",
    path: "/report",
    permission: "reports",
    modules: ["module_1"],
  },
  {
    key: "setup",
    label: "Setup",
    icon: "settings",
    path: "/setup",
    permission: "setup",
    modules: ["module_1"], // Common page - accessible in both modules
  },
  {
    key: "endpoints",
    label: "Endpoints",
    icon: "devices",
    path: "/endpoints",
    permission: "endpoints",
    modules: ["module_2"],
  },
];

/**
 * Auto-generate MODULE_PERMISSIONS_MAP from PAGES_CONFIG
 * This ensures no hardcoding - permissions are derived from where pages are used
 */
export const generateModulePermissionsMap = () => {
  const map = {};
  
  // Initialize all modules
  PAGES_CONFIG.forEach(page => {
    page.modules.forEach(moduleId => {
      if (!map[moduleId]) {
        map[moduleId] = [];
      }
      if (!map[moduleId].includes(page.permission)) {
        map[moduleId].push(page.permission);
      }
    });
  });
  
  return map;
};

/**
 * Get sidebar menu items for a specific module
 * @param {string} moduleId - Module ID (e.g., "module_1")
 * @returns {Array} Filtered menu items for that module
 */
export const getSidebarItemsForModule = (moduleId) => {
  return PAGES_CONFIG.filter(page => page.modules.includes(moduleId));
};

/**
 * Get all unique modules from config
 * @returns {Array} Array of unique module IDs
 */
export const getAllModules = () => {
  const modules = new Set();
  PAGES_CONFIG.forEach(page => {
    page.modules.forEach(moduleId => modules.add(moduleId));
  });
  return Array.from(modules);
};

/**
 * Get all pages config (for routes generation if needed)
 * @returns {Array} All pages configuration
 */
export const getAllPages = () => {
  return PAGES_CONFIG;
};
