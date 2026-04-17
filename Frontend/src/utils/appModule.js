import { APP_MODULES } from "../constants/appModules";

// App Module Management - Track which app module is selected and persist selection.
const SELECTED_APP_MODULE_KEY = "selectedAppModule";
const DEFAULT_MODULE = "module_1";

export const getSelectedAppModule = () => {
  try {
    const saved = localStorage.getItem(SELECTED_APP_MODULE_KEY);
    return saved || DEFAULT_MODULE;
  } catch {
    return DEFAULT_MODULE;
  }
};

export const setSelectedAppModule = (moduleId) => {
  try {
    localStorage.setItem(SELECTED_APP_MODULE_KEY, moduleId);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("appModuleChanged", { detail: { moduleId } }));
  } catch (error) {
    console.error("Error setting app module:", error);
  }
};

export const MODULES = APP_MODULES;
