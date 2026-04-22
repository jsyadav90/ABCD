export const BRANCH_SCOPE_KEY = "selectedBranch";
export const BRANCH_SCOPE_EVENT = "branch-scope-changed";
export const MODULE_SCOPE_KEY = "selectedModule";
export const MODULE_SCOPE_EVENT = "module-scope-changed";
export const ORG_SCOPE_KEY = "selectedOrg";
export const ORG_SCOPE_EVENT = "org-scope-changed";

export const getSelectedOrg = () => {
  try {
    const stored = localStorage.getItem(ORG_SCOPE_KEY);
    if (stored) {
      if (stored.startsWith('{')) {
        const parsed = JSON.parse(stored);
        return parsed.id || "";
      }
      return stored;
    }
    return "";
  } catch {
    return "";
  }
};

export const getSelectedOrgName = () => {
  try {
    const stored = localStorage.getItem(ORG_SCOPE_KEY);
    if (stored && stored.startsWith('{')) {
      const parsed = JSON.parse(stored);
      return parsed.name || "";
    }
    return "";
  } catch {
    return "";
  }
};

export const getSelectedOrgCode = () => {
  try {
    const stored = localStorage.getItem(ORG_SCOPE_KEY);
    if (stored && stored.startsWith('{')) {
      const parsed = JSON.parse(stored);
      return parsed.code || "";
    }
    return "";
  } catch {
    return "";
  }
};

export const setSelectedOrg = (orgId, orgName = "", orgCode = "") => {
  try {
    if (orgId) {
      const data = { id: orgId, name: orgName, code: orgCode };
      localStorage.setItem(ORG_SCOPE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(ORG_SCOPE_KEY);
    }
    const ev = new CustomEvent(ORG_SCOPE_EVENT, { detail: { orgId, orgName, orgCode } });
    window.dispatchEvent(ev);
  } catch {
    // ignore
  }
};

export const onOrgChange = (handler) => {
  const wrapped = (e) => handler(e.detail?.orgId || "", e.detail?.orgName || "", e.detail?.orgCode || "");
  window.addEventListener(ORG_SCOPE_EVENT, wrapped);
  return () => window.removeEventListener(ORG_SCOPE_EVENT, wrapped);
};

export const getSelectedBranch = () => {
  try {
    const stored = localStorage.getItem(BRANCH_SCOPE_KEY);
    if (stored) {
      // Check if it's JSON or old string format
      if (stored.startsWith('{')) {
        const parsed = JSON.parse(stored);
        return parsed.id || "";
      } else {
        // Old format, return as is
        return stored;
      }
    }
    return "";
  } catch {
    return "";
  }
};

export const getSelectedBranchName = () => {
  try {
    const stored = localStorage.getItem(BRANCH_SCOPE_KEY);
    if (stored) {
      if (stored.startsWith('{')) {
        const parsed = JSON.parse(stored);
        return parsed.name || "";
      } else {
        // Old format, no name stored
        return "";
      }
    }
    return "";
  } catch {
    return "";
  }
};

export const setSelectedBranch = (branchId, branchName = "") => {
  try {
    if (branchId) {
      const data = { id: branchId, name: branchName };
      localStorage.setItem(BRANCH_SCOPE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(BRANCH_SCOPE_KEY);
    }
    const ev = new CustomEvent(BRANCH_SCOPE_EVENT, { detail: { branchId, branchName } });
    window.dispatchEvent(ev);
  } catch {
    // ignore
  }
};

export const onBranchChange = (handler) => {
  const wrapped = (e) => handler(e.detail?.branchId || "", e.detail?.branchName || "");
  window.addEventListener(BRANCH_SCOPE_EVENT, wrapped);
  return () => window.removeEventListener(BRANCH_SCOPE_EVENT, wrapped);
};

export const getSelectedModule = () => {
  try {
    const stored = localStorage.getItem(MODULE_SCOPE_KEY);
    if (stored && stored !== 'undefined' && stored !== 'null') {
      return stored;
    }
    return "";
  } catch {
    return "";
  }
};

export const setSelectedModule = (moduleKey) => {
  try {
    if (moduleKey) {
      localStorage.setItem(MODULE_SCOPE_KEY, moduleKey);
    } else {
      localStorage.removeItem(MODULE_SCOPE_KEY);
    }
    const ev = new CustomEvent(MODULE_SCOPE_EVENT, { detail: { moduleKey } });
    window.dispatchEvent(ev);
  } catch {
    // ignore
  }
};

export const onModuleChange = (handler) => {
  const wrapped = (e) => handler(e.detail?.moduleKey || "");
  window.addEventListener(MODULE_SCOPE_EVENT, wrapped);
  return () => window.removeEventListener(MODULE_SCOPE_EVENT, wrapped);
};
