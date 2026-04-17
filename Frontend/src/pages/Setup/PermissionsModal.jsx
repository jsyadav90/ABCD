// @ts-ignore
import React, { useState, useEffect, useMemo } from "react";
// @ts-ignore
import { Modal, Button, Alert, Card } from "../../components";
import { roleAPI } from "../../services/api";
import { PERMISSION_MODULES, MAIN_MODULES } from "../../constants/permissions";
import "./Setup.css"; // Reuse CSS

// Helper to check if a permission is assigned
const hasPermission = (assignedKeys, moduleKey, pageKey, actionKey) => {
  if (assignedKeys.includes("*")) return true;
  // Check exact match: module:page:action
  const fullKey = `${moduleKey}:${pageKey}:${actionKey}`;
  return assignedKeys.includes(fullKey);
};

const PermissionsModal = ({ isOpen, onClose, role, onSaveSuccess, onSave }) => {
  // Store flat array of permission keys: ["users:page_buttons:add", "users:rows_buttons:view", "assets:page_buttons:add", ...]
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedModules, setExpandedModules] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModuleKey, setSelectedModuleKey] = useState("all");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("all");

  useEffect(() => {
    if (role && isOpen) {
      // If role has legacy permissions structure or new flat keys, normalize to flat keys
      let initialKeys = [];

      if (role.name === "super_admin" || (role.permissionKeys && role.permissionKeys.includes("*"))) {
        initialKeys = ["*"];
      } else if (Array.isArray(role.permissionKeys) && role.permissionKeys.length > 0) {
        initialKeys = role.permissionKeys;
      } else if (Array.isArray(role.permissions) && role.permissions.length > 0) {
        // Convert legacy object structure to flat keys if necessary
        // Assuming legacy was resource:action
        // We might need a migration strategy if keys don't match exactly
        // For now, let's rely on permissionKeys which should be the source of truth
        initialKeys = [];
      }

      setAssignedPermissions(initialKeys);
      setError("");
      
      // Expand all modules by default
      const allExpanded = {};
      PERMISSION_MODULES.forEach(m => allExpanded[m.key] = true);
      setExpandedModules(allExpanded);
      setSearchTerm("");
      setSelectedModuleKey("all");
      setSelectedCategoryKey("all");
    }
  }, [role, isOpen]);

  const assignedMainModules = useMemo(() => {
    if (role?.name === "super_admin") {
      return MAIN_MODULES.map((module) => module.key);
    }

    if (!Array.isArray(role?.modules) || role.modules.length === 0) {
      return [];
    }

    return Array.from(
      new Set(
        role.modules
          .filter((m) => typeof m === "string")
          .map((m) => m.trim().toLowerCase())
          .filter(Boolean)
      )
    );
  }, [role]);

  const availablePermissionModules = useMemo(() => {
    if (assignedMainModules.length === 0) {
      return [];
    }

    const allowedSubModules = new Set(
      MAIN_MODULES.filter((module) => assignedMainModules.includes(module.key))
        .flatMap((module) => module.subModules)
    );

    return PERMISSION_MODULES.filter((module) => allowedSubModules.has(module.key));
  }, [assignedMainModules]);

  // Filter modules based on search term
  const filteredModules = useMemo(() => {
    if (!searchTerm.trim()) return availablePermissionModules;
    
    const lowerSearch = searchTerm.toLowerCase();
    
    return availablePermissionModules.map(module => {
      // Check if module matches
      const moduleMatches = module.label.toLowerCase().includes(lowerSearch);
      
      // Check if any page matches
      const matchingPages = module.pages.filter(page => {
        const pageMatches = page.label.toLowerCase().includes(lowerSearch);
        const actionMatches = page.actions.some(action => 
          action.label.toLowerCase().includes(lowerSearch)
        );
        return pageMatches || actionMatches;
      });

      if (moduleMatches || matchingPages.length > 0) {
        return {
          ...module,
          pages: moduleMatches ? module.pages : matchingPages
        };
      }
      
      return null;
    }).filter(Boolean);
  }, [searchTerm, availablePermissionModules]);

  const selectedModules = useMemo(() => {
    let modules = filteredModules;
    
    if (selectedModuleKey !== "all") {
      // When specific main module selected, show its submodules
      const mainModule = MAIN_MODULES.find(m => m.key === selectedModuleKey);
      if (mainModule) {
        modules = modules.filter(module => mainModule.subModules.includes(module.key));
      }
    }
    
    return modules;
  }, [filteredModules, selectedModuleKey]);

  const moduleOptions = useMemo(() => [
    // { key: "all", label: "All Assigned Modules" },
    ...MAIN_MODULES.filter((module) => assignedMainModules.includes(module.key)).map((module) => ({
      key: module.key,
      label: module.label,
    })),
  ], [assignedMainModules]);

  const categoryOptions = useMemo(() => {
    const options = [{ key: "all", label: "All Categories" }];
    
    if (selectedModuleKey === "all") {
      availablePermissionModules.forEach(module => {
        options.push({ key: module.key, label: module.label });
      });
    } else {
      const mainModule = MAIN_MODULES.find(m => m.key === selectedModuleKey);
      if (mainModule) {
        mainModule.subModules.forEach(subModuleKey => {
          const subModule = availablePermissionModules.find(m => m.key === subModuleKey);
          if (subModule) {
            options.push({ key: subModule.key, label: subModule.label });
          }
        });
      }
    }
    
    return options;
  }, [selectedModuleKey, availablePermissionModules]);

  const finalSelectedModules = useMemo(() => {
    let modules = selectedModules;
    
    if (selectedCategoryKey !== "all") {
      modules = modules.filter(module => module.key === selectedCategoryKey);
    }
    
    return modules;
  }, [selectedModules, selectedCategoryKey]);

  // Auto-expand on search
  useEffect(() => {
    if (searchTerm.trim()) {
      const allExpanded = {};
      filteredModules.forEach(m => allExpanded[m.key] = true);
      setExpandedModules(allExpanded);
    }
  }, [searchTerm, filteredModules]);

  const toggleModuleExpand = (moduleKey) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  // Toggle all actions in a page
  const handlePageToggle = (moduleKey, pageKey, isChecked) => {
    setAssignedPermissions((prev) => {
      if (prev.includes("*")) return prev;

      let newKeys = [...prev];
      const pageModule = PERMISSION_MODULES.find(m => m.key === moduleKey);
      const page = pageModule?.pages.find(p => p.key === pageKey);

      if (page) {
        if (isChecked) {
          // Check all actions in this page
          page.actions.forEach((action) => {
            const fullKey = `${moduleKey}:${pageKey}:${action.key}`;
            if (!newKeys.includes(fullKey)) {
              newKeys.push(fullKey);
            }
          });
        } else {
          // Uncheck all actions in this page
          newKeys = newKeys.filter((k) => !k.startsWith(`${moduleKey}:${pageKey}:`));
        }
      }

      // Auto-add module access key if any action is selected
      const module = PERMISSION_MODULES.find(m => m.key === moduleKey);
      if (module?.accessKey && newKeys.some(k => k.startsWith(`${moduleKey}:`) && k !== module.accessKey)) {
        if (!newKeys.includes(module.accessKey)) {
          newKeys.push(module.accessKey);
        }
      }

      // Auto-remove module access key if no actions remain
      if (module?.accessKey && !newKeys.some(k => k.startsWith(`${moduleKey}:`) && k !== module.accessKey)) {
        newKeys = newKeys.filter(k => k !== module.accessKey);
      }

      return newKeys;
    });
  };

  // Toggle individual action
  const handleActionToggle = (moduleKey, pageKey, actionKey) => {
    setAssignedPermissions((prev) => {
      if (prev.includes("*")) return prev;

      const fullKey = `${moduleKey}:${pageKey}:${actionKey}`;
      const exists = prev.includes(fullKey);

      let newKeys = [...prev];

      if (exists) {
        // Remove the action
        newKeys = newKeys.filter((k) => k !== fullKey);
      } else {
        // Add the action
        newKeys.push(fullKey);
      }

      // Auto-add module access key if any action is selected
      const module = PERMISSION_MODULES.find(m => m.key === moduleKey);
      if (module?.accessKey && newKeys.some(k => k.startsWith(`${moduleKey}:`) && k !== module.accessKey)) {
        if (!newKeys.includes(module.accessKey)) {
          newKeys.push(module.accessKey);
        }
      }

      // Auto-remove module access key if no actions remain
      if (module?.accessKey && !newKeys.some(k => k.startsWith(`${moduleKey}:`) && k !== module.accessKey)) {
        newKeys = newKeys.filter(k => k !== module.accessKey);
      }

      return newKeys;
    });
  };

  const handleModuleToggle = (module, isChecked) => {
    setAssignedPermissions((prev) => {
      if (prev.includes("*")) return prev;
      let newKeys = [...prev];

      // Toggle module access key
      if (module.accessKey) {
        if (isChecked) {
           if (!newKeys.includes(module.accessKey)) newKeys.push(module.accessKey);
        } else {
           newKeys = newKeys.filter(k => k !== module.accessKey);
        }
      }

      // When checking module, give basic view access
      // When unchecking, remove view access
      module.pages.forEach(page => {
        // Find view action in this page, or use first action if no view exists
        const viewAction = page.actions.find(action => action.key === "view") || page.actions[0];
        if (viewAction) {
          const viewKey = `${module.key}:${page.key}:${viewAction.key}`;
          if (isChecked) {
            if (!newKeys.includes(viewKey)) newKeys.push(viewKey);
          } else {
            // When unchecking module, remove all actions from this module
            page.actions.forEach(action => {
              const actionKey = `${module.key}:${page.key}:${action.key}`;
              newKeys = newKeys.filter(k => k !== actionKey);
            });
          }
        }
      });

      return newKeys;
    });
  };

  const handleSelectAllModule = (module) => {
    setAssignedPermissions((prev) => {
      if (prev.includes("*")) return prev;
      let newKeys = [...prev];

      // Add module access key if it exists
      if (module.accessKey && !newKeys.includes(module.accessKey)) {
        newKeys.push(module.accessKey);
      }

      // Add all actions for all pages in this module
      module.pages.forEach(page => {
        page.actions.forEach(action => {
          const fullKey = `${module.key}:${page.key}:${action.key}`;
          if (!newKeys.includes(fullKey)) {
            newKeys.push(fullKey);
          }
        });
      });

      return newKeys;
    });
  };

  const isModuleFullySelected = (assignedKeys, module) => {
    if (assignedKeys.includes("*")) return true;

    // Module is considered selected if it has the access key
    if (module.accessKey) {
      return assignedKeys.includes(module.accessKey);
    }

    // For modules without access key, check if at least view actions are selected
    return module.pages?.some((page) => {
      const viewAction = page.actions.find(action => action.key === "view");
      if (viewAction) {
        return assignedKeys.includes(`${module.key}:${page.key}:${viewAction.key}`);
      }
      return false;
    });
  };

  // Check if a page has all its actions selected
  const isPageFullySelected = (assignedKeys, moduleKey, page) => {
    if (assignedKeys.includes("*")) return true;
    
    return page.actions.every(action => {
      const fullKey = `${moduleKey}:${page.key}:${action.key}`;
      return assignedKeys.includes(fullKey);
    });
  };

  // Check if a page has some of its actions selected
  const isPagePartiallySelected = (assignedKeys, moduleKey, page) => {
    if (assignedKeys.includes("*")) return true;
    
    const hasAny = page.actions.some(action => {
      const fullKey = `${moduleKey}:${page.key}:${action.key}`;
      return assignedKeys.includes(fullKey);
    });

    const hasAll = page.actions.every(action => {
      const fullKey = `${moduleKey}:${page.key}:${action.key}`;
      return assignedKeys.includes(fullKey);
    });

    return hasAny && !hasAll;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      // Normalize permissions for saving
      // If super admin, ensure we keep "*"
      const finalKeys = assignedPermissions.includes("*") ? ["*"] : assignedPermissions;

      if (onSave) {
        // Custom save handler (for user permissions)
        const updatedRole = { ...role, permissionKeys: finalKeys };
        onSave(updatedRole);
        onSaveSuccess();
        onClose();
      } else {
        // Default save to API
        const payload = {
          permissionKeys: finalKeys,
        };

        await roleAPI.update(role._id || role.id, payload);
        onSaveSuccess();
        onClose();
      }
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to update rights";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = role?.name === "super_admin" || assignedPermissions.includes("*");

  return (
    <Modal
      isOpen={isOpen}
      title={`Manage Rights - ${role?.displayName || "Role"}`}
      onClose={onClose}
      size="xl"
      className="permission-model"
      footer={
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", width: "100%" }}>
          <div />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            {!isSuperAdmin && (
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Rights"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {error && (
        <div className="setup-error">
          <Alert type="danger" 
// @ts-ignore
          message={error} />
        </div>
      )}

      {isSuperAdmin && (
        // @ts-ignore
        <Alert type="info" message="This role has Super Admin privileges (Full Access). Individual rights cannot be modified." />
      )}

      <div className="permission-toolbar">
          <div className="permission-toolbar__selector">
            <label htmlFor="permission-module-select">Select Module</label>
            <select
              id="permission-module-select"
              value={selectedModuleKey}
              onChange={(e) => setSelectedModuleKey(e.target.value)}
            >
              {moduleOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="permission-toolbar__selector">
            <label htmlFor="permission-category-select">View Category</label>
            <select
              id="permission-category-select"
              value={selectedCategoryKey}
              onChange={(e) => setSelectedCategoryKey(e.target.value)}
            >
              {categoryOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="permission-toolbar__search">
            <label htmlFor="permission-search-input">Search rights</label>
            <input
              id="permission-search-input"
              type="text"
              placeholder="Search modules, pages, or actions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* <div className="permission-summary-card">
          <div>
            <span className="summary-label">Selected module</span>
            <strong>{selectedModuleKey === "all" ? "All Modules" : moduleOptions.find(option => option.key === selectedModuleKey)?.label}</strong>
          </div>
          <div>
            <span className="summary-label">Selected category</span>
            <strong>{selectedCategoryKey === "all" ? "All Categories" : categoryOptions.find(option => option.key === selectedCategoryKey)?.label}</strong>
          </div>
          <div>
            <span className="summary-label">Matched sections</span>
            <strong>{finalSelectedModules.length}</strong>
          </div>
          <div>
            <span className="summary-label">Search active</span>
            <strong>{searchTerm.trim() ? "Yes" : "No"}</strong>
          </div>
        </div> */}

        <div className="permission-tree-container">
          <div className="tree-root">
            {finalSelectedModules.length === 0 && (
                <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
                  No matching rights found.
                </div>
            )}

            {finalSelectedModules.map((module) => (
              <div key={module.key} className="tree-module">
                {/* Module Header */}
                <div
                  className="module-header"
                  onClick={(e) => {
                    // @ts-ignore
                    if (e.target.type !== 'checkbox' && e.target.tagName !== 'BUTTON') {
                      toggleModuleExpand(module.key);
                    }
                  }}
                >
                  <span className={`expand-icon ${expandedModules[module.key] ? 'expanded' : ''}`}>▶</span>
                  {module.accessKey && (
                    <input
                      type="checkbox"
                      checked={isModuleFullySelected(assignedPermissions, module)}
                      disabled={isSuperAdmin}
                      onChange={(e) => handleModuleToggle(module, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      title="Give view access to this module"
                    />
                  )}
                  <span>{module.label}</span>
                  {!isSuperAdmin && (
                    <button
                      className="select-all-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAllModule(module);
                      }}
                      title="Select all actions in this module"
                      style={{
                        marginLeft: 'auto',
                        padding: '2px 8px',
                        fontSize: '0.8rem',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Select All
                    </button>
                  )}
                </div>

                {/* Submodules (Pages) */}
                {expandedModules[module.key] && (
                  <div className="module-children">
                    {module.pages.map((page) => {
                      const isModuleAccessGranted = isModuleFullySelected(assignedPermissions, module);
                      
                      // Check if page is fully selected
                      const isPageSelected = isPageFullySelected(assignedPermissions, module.key, page);

                      return (
                        <div key={page.key} className="tree-submodule">
                          {/* Submodule Header - Page level checkbox to toggle all actions in this page */}
                          <div className="submodule-header">
                            <label className="checkbox-label" title={`Toggle all actions for ${page.label}`}>
                              <input
                                type="checkbox"
                                checked={isPageSelected}
                                disabled={!isModuleAccessGranted || isSuperAdmin}
                                onChange={(e) => handlePageToggle(module.key, page.key, e.target.checked)}
                              />
                              <span>{page.label}</span>
                            </label>
                          </div>

                          {/* Actions Children */}
                          <div className="submodule-children">
                            {/* Individual Actions */}
                            {page.actions.map((action) => {
                              const isActionChecked = hasPermission(assignedPermissions, module.key, page.key, action.key);
                              
                              return (
                                <div key={action.key} className="tree-action">
                                  <label className="checkbox-label" title={action.label}>
                                    <input
                                      type="checkbox"
                                      checked={isActionChecked}
                                      disabled={!isModuleAccessGranted || isSuperAdmin}
                                      onChange={() =>
                                        handleActionToggle(module.key, page.key, action.key)
                                      }
                                    />
                                    <span>{action.label}</span>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
    </Modal>
  );
};

export default PermissionsModal;
