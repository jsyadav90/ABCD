// App Module Management - Track which module (Module 1 or Module 2) is selected

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

export const MODULES = [
  { id: "module_1", label: "Module 1" },
  { id: "module_2", label: "Module 2" },
];
