// Central app module definitions for the frontend.
// Use this single source of truth when module names or IDs are referenced.

export const APP_MODULES = [
  { id: "module_1", label: "IT Operations" },
  { id: "module_2", label: "Endpoint Management" },
];

export const getAppModuleLabel = (moduleId) => {
  return APP_MODULES.find((module) => module.id === moduleId)?.label || moduleId;
};
