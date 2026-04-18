// @ts-nocheck
import { useState, useEffect } from "react";
import { roleAPI } from "../../../services/api.js";
import { MAIN_MODULES } from "../../../constants/permissions";
import { generateModulePermissionsMap } from "../../../constants/navigationConfig";
import { Table, Button, Input, Modal, Card, Alert, MultiSelect } from "../../../components";
import PermissionsModal from "../PermissionsModal";
import { hasPermission } from "../../../utils/permissionHelper";

const RoleRightsTab = ({ setToast }) => {
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState("");

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    displayName: "",
    description: "",
    priority: 100,
    isActive: true,
    isDefault: false,
    permissions: [],
    permissionKeys: [],
    modules: [],
  });
  const [roleFormError, setRoleFormError] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [copyFromRoleId, setCopyFromRoleId] = useState("");
  
  // New State for displayName validation
  const [displayNameValidationMsg, setDisplayNameValidationMsg] = useState("");
  const [nameValidationMsg, setNameValidationMsg] = useState("");
  const [deactivateDefaultModalOpen, setDeactivateDefaultModalOpen] = useState(false);
  const [roleToDeactivate, setRoleToDeactivate] = useState(null);
  const [replacementRoleId, setReplacementRoleId] = useState("");
  const [replacementMakeDefault, setReplacementMakeDefault] = useState(false);
  const [deactivateModalError, setDeactivateModalError] = useState("");
  const [pendingSavePayload, setPendingSavePayload] = useState(null);

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      setRolesError("");
      const response = await roleAPI.getAll();
      const data = response.data?.data || response.data || [];
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to load roles";
      setRolesError(message);
    } finally {
      setRolesLoading(false);
    }
  };

  // Get all permission keys allowed for the given modules
  const getPermissionsForModules = (modules) => {
    if (!Array.isArray(modules)) return [];
    
    const modulePermissionsMap = generateModulePermissionsMap();
    return modules.flatMap(moduleId => modulePermissionsMap[moduleId] || []).filter(Boolean);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // Real-time Validation Effect (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!roleModalOpen) return;

      let nameValidationMessage = "";
      let displayNameValidationMessage = "";

      if (roleForm.name) {
        // Check for duplicate internal name
        const nameExists = roles.some(
          (r) =>
            r.name === roleForm.name &&
            (!editingRole || r._id !== editingRole._id)
        );

        if (nameExists) {
          nameValidationMessage = "This role name already exists. Please choose a different name.";
        }
      }

      if (roleForm.displayName) {
        // Check for duplicate display name
        const displayNameExists = roles.some(
          (r) =>
            r.displayName === roleForm.displayName &&
            (!editingRole || r._id !== editingRole._id)
        );

        if (displayNameExists) {
          displayNameValidationMessage = "This display name already exists. Please choose a different display name.";
        }
      }

      setNameValidationMsg(nameValidationMessage);
      setDisplayNameValidationMsg(displayNameValidationMessage);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [roleForm.name, roleForm.displayName, roles, editingRole, roleModalOpen]);

  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleForm({
      name: "",
      displayName: "",
      description: "",
      priority: 100,
      isActive: true,
      isDefault: false,
      permissions: [],
      permissionKeys: [],
      modules: [],
    });
    setRoleFormError("");
    setNameValidationMsg("");
    setDisplayNameValidationMsg("");
    setCopyFromRoleId("");
    setRoleModalOpen(true);
  };

  const openEditRoleModal = (/** @type {{ name: any; displayName: any; description: any; priority: any; isActive: boolean; isDefault: boolean; permissions: any; permissionKeys: any; }} */ role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name || "",
      displayName: role.displayName || "",
      description: role.description || "",
      priority: role.priority || 100,
      isActive: role.isActive !== false,
      isDefault: role.isDefault === true,
      permissions: role.permissions || [],
      permissionKeys: role.permissionKeys || [],
      modules: role.modules || [],
    });
    setRoleFormError("");
    setNameValidationMsg("");
    setDisplayNameValidationMsg("");
    setRoleModalOpen(true);
  };

  const openPermissionsModal = (/** @type {any} */ role) => {
    setEditingRole(role);
    setPermissionsModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setEditingRole(null);
  };

  const closePermissionsModal = () => {
    setPermissionsModalOpen(false);
    setEditingRole(null);
  };

  const handleRoleInputChange = (/** @type {{ target: { name: any; value: any; }; }} */ e) => {
    const { name, value } = e.target;
    
    setRoleForm((prev) => {
      let updates = { [name]: value };

      // Automatic Internal Name Generation
      if (name === "displayName" && !editingRole) {
        const internalName = value
          .toLowerCase()
          .replace(/\s+/g, "_") // Replace spaces with underscores
          .replace(/[^a-z0-9_]/g, ""); // Remove special chars except underscore
        updates.name = internalName;
      }

      return {
        ...prev,
        ...updates,
      };
    });
  };

  const handleRoleModulesChange = (/** @type {{ target: { value: any; }; }} */ e) => {
    const selectedModules = Array.isArray(e.target.value) ? e.target.value : [];
    const cleanedModules = Array.from(new Set(selectedModules.filter((value) => typeof value === "string" && value.trim() !== "")));

    // Get all permissions allowed for the selected modules
    const allowedPermissions = getPermissionsForModules(cleanedModules);

    setRoleForm((prev) => ({
      ...prev,
      modules: cleanedModules,
      // Filter out permissions that are not allowed for the selected modules
      permissionKeys: (prev.permissionKeys || []).filter(pk => allowedPermissions.includes(pk)),
    }));
  };

  const handleCopyPermissions = (/** @type {import("react").SetStateAction<string>} */ sourceRoleId) => {
    setCopyFromRoleId(sourceRoleId);
    if (!sourceRoleId) return;

    const sourceRole = roles.find(
      (r) => r._id === sourceRoleId || r.id === sourceRoleId
    );

    if (sourceRole) {
      if (
        window.confirm(
          `Are you sure you want to copy rights from "${sourceRole.displayName}"? This will overwrite any current rights for the new role.`
        )
      ) {
        setRoleForm((prev) => ({
          ...prev,
          permissionKeys: [...(sourceRole.permissionKeys || [])],
          permissions: [...(sourceRole.permissions || [])],
          modules: [...(sourceRole.modules || [])],
        }));
        setToast({
          type: "success",
          message: `Rights copied from ${sourceRole.displayName}`,
        });
      } else {
        setCopyFromRoleId(""); // Reset if cancelled
      }
    }
  };

  const handleRoleToggleChange = (/** @type {string} */ name) => {
    setRoleForm((prev) => {
      if (name === "isActive" && prev.isActive === true && prev.isDefault === true) {
        return {
          ...prev,
          isActive: false,
          isDefault: false,
        };
      }

      return {
        ...prev,
        [name]: !prev[name],
      };
    });
  };

  const confirmDefaultRoleOverride = () => {
    if (!roleForm.isDefault) return true;

    const existingDefault = roles.find((r) => {
      if (r.isDefault !== true) return false;

      if (!editingRole) return true;

      const existingId = String(r._id || r.id || "");
      const editingId = String(editingRole._id || editingRole.id || "");
      return existingId !== editingId;
    });

    if (!existingDefault) return true;

    const existingLabel = existingDefault.displayName || existingDefault.name || "another role";

    return window.confirm(
      `Role "${existingLabel}" is already the default role. ` +
      `Do you want to make "${roleForm.displayName || roleForm.name}" the new default instead?`
    );
  };

  const hasActiveDefaultRole = () =>
    roles.some((r) => r.isDefault === true && r.isActive === true);

  const needsReplacementDialog = (role) => {
    if (!role) return false;
    if (!hasActiveDefaultRole()) return true;
    if (role.isDefault === true) return true;
    return false;
  };

  const openDeactivateDefaultModal = (role, payload = null) => {
    setRoleToDeactivate(role);
    setPendingSavePayload(payload);
    setReplacementRoleId("");
    setReplacementMakeDefault(false);
    setDeactivateModalError("");
    setDeactivateDefaultModalOpen(true);
  };

  const closeDeactivateDefaultModal = () => {
    setDeactivateDefaultModalOpen(false);
    setRoleToDeactivate(null);
    setPendingSavePayload(null);
    setReplacementRoleId("");
    setReplacementMakeDefault(false);
    setDeactivateModalError("");
  };

  const confirmRoleInactivation = () => {
    if (!editingRole || editingRole.isActive === false || roleForm.isActive !== false) return true;

    return window.confirm(
      `Role "${editingRole.displayName || editingRole.name}" is currently active and will be deactivated. ` +
      `All users assigned to this role will be reassigned to the default role. Do you want to continue?`
    );
  };

  const saveRole = async () => {
    if (!roleForm.name.trim() || !roleForm.displayName.trim()) {
      setRoleFormError("Role name and display name are required");
      return;
    }

    if (nameValidationMsg || displayNameValidationMsg) {
      setRoleFormError("Please fix validation errors before saving.");
      return;
    }

    // Validation: Cannot make an inactive role the default
    if (roleForm.isDefault === true && roleForm.isActive === false) {
      setRoleFormError("You cannot set an inactive role as the default role. Please activate the role first.");
      return;
    }

    try {
      if (!confirmDefaultRoleOverride()) {
        return;
      }

      const payload = {
        name: roleForm.name.trim().toLowerCase(),
        displayName: roleForm.displayName.trim(),
        description: roleForm.description.trim(),
        priority: parseInt(roleForm.priority) || 100,
        isActive: roleForm.isActive,
        isDefault: roleForm.isDefault,
        permissions: [],
        permissionKeys: roleForm.permissionKeys || [],
        modules: roleForm.modules || [],
      };

      if (
        editingRole &&
        editingRole.isActive === true &&
        roleForm.isActive === false &&
        needsReplacementDialog(editingRole)
      ) {
        openDeactivateDefaultModal(editingRole, payload);
        return;
      }

      if (!confirmRoleInactivation()) {
        return;
      }

      setSavingRole(true);
      setRoleFormError("");

      if (editingRole) {
        await roleAPI.update(editingRole._id || editingRole.id, payload);
        setToast({ type: "success", message: "Role details updated successfully" });
      } else {
        await roleAPI.create(payload);
        setToast({ type: "success", message: "Role created successfully" });
      }

      closeRoleModal();
      await loadRoles();
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to save role";
      setRoleFormError(message);
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeactivateDefaultRoleSubmit = async () => {
    if (!roleToDeactivate) return;

    // Always start with a clean deactivation payload
    const payload = {
      isActive: false,
      isDefault: false,
    };

    if (replacementRoleId) {
      payload.newDefaultRoleId = replacementRoleId;
      if (replacementMakeDefault === true) {
        payload.makeNewDefault = true;
      }
    } else {
      payload.clearUsers = true;
    }

    console.log("📤 Sending deactivate payload:", payload);
    console.log("🎯 replacementMakeDefault state:", replacementMakeDefault);
    console.log("🆔 replacementRoleId:", replacementRoleId);

    setSavingRole(true);
    setDeactivateModalError("");

    try {
      await roleAPI.update(roleToDeactivate._id || roleToDeactivate.id, payload);
      setToast({ type: "success", message: "Role disabled successfully" });
      closeDeactivateDefaultModal();
      closeRoleModal();
      await loadRoles();
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to disable role";
      setDeactivateModalError(message);
    } finally {
      setSavingRole(false);
    }
  };

  const handlePermissionsSaveSuccess = async () => {
    setToast({ type: "success", message: "Rights updated successfully" });
    await loadRoles();
  };

  const hasDefaultRole = roles.some((r) => r.isDefault === true && r.isActive === true);

  const deleteRole = async (/** @type {{ _id: any; id: any; }} */ role) => {
    if (!window.confirm("Are you sure you want to delete this role?")) {
      return;
    }

    try {
      await roleAPI.delete(role._id || role.id);
      setToast({ type: "success", message: "Role deleted successfully" });
      await loadRoles();
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to delete role";
      setToast({ type: "danger", message });
    }
  };

  const roleColumns = [
    {
      header: "Role",
      key: "displayName",
    },
      // {
      //   header: "System Name",
      //   key: "name",
      // },
    {
      header: "Category",
      key: "category",
    },
    {
      header: "Status",
      key: "isActive",
      render: (/** @type {{ isActive: any; }} */ row) => (row.isActive ? "Active" : "Inactive"),
    },
    {
      header: "Default",
      key: "isDefault",
      render: (/** @type {{ isDefault: any; }} */ row) => (row.isDefault ? "Yes" : "No"),
    },
    {
      header: "Modules",
      key: "modules",
      render: (/** @type {{ modules: string[]; }} */ row) => (
        <span title={(row.modules || []).join(", ") || "None"}>
          {(row.modules || []).length || 0}
        </span>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      render: (/** @type {{ isActive: any; category: string; _id: any; id: any; }} */ row) => (
        <div className="setup-table-actions">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openEditRoleModal(row)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="info"
            onClick={() => openPermissionsModal(row)}
          >
            Rights
          </Button>
          {row.isActive && row.category !== "system" && (
            <Button
              size="sm"
              variant="warning"
              onClick={() => {
                if (needsReplacementDialog(row)) {
                  openDeactivateDefaultModal(row, { isActive: false, isDefault: false });
                  return;
                }

                const confirm = window.confirm(
                  `Role "${row.displayName || row.name}" will be deactivated. ` +
                  `All users currently assigned to this role will be reassigned to the default role. Continue?`
                );

                if (!confirm) return;

                (async () => {
                  try {
                    await roleAPI.update(row._id || row.id, { isActive: false });
                    setToast({ type: "success", message: "Role disabled successfully" });
                    await loadRoles();
                  } catch (error) {
                    const message =
                      error.response?.data?.message || error.message || "Failed to disable role";
                    setToast({ type: "danger", message });
                  }
                })();
              }}
            >
              Disable
            </Button>
          )}
          {row.category !== "system" && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => deleteRole(row)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="setup-section">
      <div className="setup-section-header">
        <h2>Roles & User Management Rights</h2>
        {hasPermission("setup:roles:add_role") && (
          <Button variant="primary" onClick={openCreateRoleModal}>
            Add Role
          </Button>
        )}
      </div>

      {!hasDefaultRole && (
        <div style={{
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          background: "#fff4e5",
          border: "1px solid #f0c27b",
          color: "#92400e",
          fontSize: "0.95rem",
        }}>
          Warning: There is currently no default role assigned. Please set one so users reassigned from inactive roles have a fallback.
        </div>
      )}

      {rolesError && (
        <div className="setup-error">
          <Alert type="danger" message={rolesError} />
        </div>
      )}

      <Card>
        {rolesLoading ? (
          <div className="setup-loading">Loading roles...</div>
        ) : (
          <Table 
            columns={roleColumns} 
            data={roles} 
            pageSize={10} 
            rowClassName={(/** @type {{ isActive: any; }} */ row) => !row.isActive ? "table__row--inactive" : ""}
          />
        )}
      </Card>

      {/* Edit Role Details Modal */}
      {roleModalOpen && (
        <Modal
          isOpen={roleModalOpen}
          title={editingRole ? "Edit Role Details" : "Add Role"}
          onClose={closeRoleModal}
          size="lg"
          className="setup-role-modal"
          footer={
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={closeRoleModal} disabled={savingRole}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveRole} disabled={savingRole || !!nameValidationMsg || !!displayNameValidationMsg}>
                {editingRole ? "Save Changes" : "Create Role"}
              </Button>
            </div>
          }
        >
          {roleFormError && (
            <div className="setup-error">
              <Alert type="danger" message={roleFormError} />
            </div>
          )}

          <div className="setup-modal-grid">
            <Input
              name="displayName"
              label="Role Display Name"
              value={roleForm.displayName}
              onChange={handleRoleInputChange}
              placeholder="e.g., User Administrator"
              required
            />
            {displayNameValidationMsg && (
              <span style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                {displayNameValidationMsg}
              </span>
            )}
            {!editingRole && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Input
                  name="name"
                  label="Role Internal Name"
                  value={roleForm.name}
                  onChange={handleRoleInputChange}
                  placeholder="e.g., user_admin (no spaces)"
                  required
                />
                {nameValidationMsg && (
                  <span style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                    {nameValidationMsg}
                  </span>
                )}
              </div>
            )}
            <Input
              name="priority"
              label="Priority (1-1000)"
              type="number"
              value={roleForm.priority}
              onChange={handleRoleInputChange}
              placeholder="100"
            />
            <div className="setup-checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={roleForm.isActive}
                  onChange={() => handleRoleToggleChange("isActive")}
                />
                Is Active
              </label>
              <label className="checkbox-label" style={{ opacity: roleForm.isActive ? 1 : 0.5 }}>
                <input
                  type="checkbox"
                  checked={roleForm.isDefault}
                  disabled={!roleForm.isActive}
                  onChange={() => {
                    if (roleForm.isActive) {
                      handleRoleToggleChange("isDefault");
                    }
                  }}
                  title={!roleForm.isActive ? "Role must be active to set as default" : ""}
                />
                Is Default
              </label>
              {roleForm.isDefault && !roleForm.isActive && (
                <span style={{ color: "#dc2626", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                  ⚠️ Role must be active to be default
                </span>
              )}
            </div>
          </div>

          {!editingRole && (
             <div className="setup-modal-full" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, fontSize: "0.9rem" }}>
                  Copy Rights from Existing Role
                </label>
                <select
                  className="setup-input"
                  value={copyFromRoleId}
                  onChange={(e) => handleCopyPermissions(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
                >
                  <option value="">-- Select a role to copy rights --</option>
                  {roles.map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.displayName} ({r.permissionKeys?.length || 0} rights, {(r.modules || []).length || 0} modules)
                    </option>
                  ))}
                </select>
                <small style={{ color: "#6b7280", display: "block", marginTop: "0.25rem" }}>
                  Select a role to automatically copy its rights and modules to this new role.
                </small>
             </div>
          )}

          <div className="setup-modal-full">
            <MultiSelect
              name="modules"
              label="Modules"
              value={roleForm.modules}
              onChange={handleRoleModulesChange}
              options={MAIN_MODULES.map(module => ({ value: module.key, label: module.label }))}
              placeholder="Select modules..."
            />
            <small style={{ color: "#6b7280", display: "block", marginTop: "0.25rem" }}>
              Pick the modules this role may access. Manage rights will only show the modules assigned here.
            </small>
          </div>

          <div className="setup-modal-full">
            <Input
              name="description"
              label="Description"
              value={roleForm.description}
              onChange={handleRoleInputChange}
              placeholder="Describe what this role can do"
            />
          </div>
        </Modal>
      )}

      {deactivateDefaultModalOpen && (
        <Modal
          isOpen={deactivateDefaultModalOpen}
          title={
            roleToDeactivate
              ? `Deactivate Role: ${roleToDeactivate.displayName || roleToDeactivate.name}`
              : "Deactivate Role"
          }
          onClose={closeDeactivateDefaultModal}
          size="md"
          footer={
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={closeDeactivateDefaultModal} disabled={savingRole}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleDeactivateDefaultRoleSubmit} disabled={savingRole}>
                Confirm
              </Button>
            </div>
          }
        >
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ margin: 0 }}>
              You are deactivating the role <strong>{roleToDeactivate?.displayName || roleToDeactivate?.name}</strong>.
            </p>
            <p style={{ margin: "0.5rem 0 0" }}>
              Select a replacement role for users currently assigned to this role. If you leave the selection empty, those users will become unassigned and no new default role will be created.
            </p>
            {(!hasDefaultRole || roleToDeactivate?.isDefault) && (
              <p style={{ margin: "0.5rem 0 0", color: "#92400e" }}>
                Since there is no active default role after this change, you can choose a replacement role and optionally make it the new default.
              </p>
            )}
          </div>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                Replacement Role
              </label>
              <select
                className="setup-input"
                value={replacementRoleId}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  console.log("🔄 Replacement role selected:", selectedValue);
                  setReplacementRoleId(selectedValue);
                  if (!selectedValue) {
                    console.log("📋 Clearing default checkbox");
                    setReplacementMakeDefault(false);
                  }
                }}
                style={{ width: "100%", padding: "0.6rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
              >
                <option value="">-- No replacement role --</option>
                {roles
                  .filter((r) => r.isActive && String(r._id || r.id) !== String(roleToDeactivate?._id || roleToDeactivate?.id || ""))
                  .map((role) => (
                    <option key={role._id || role.id} value={role._id || role.id}>
                      {role.displayName || role.name}
                    </option>
                  ))}
              </select>
            </div>
            {replacementRoleId ? (() => {
              const selectedRole = roles.find(r => String(r._id || r.id) === String(replacementRoleId));
              const isSelectedRoleActive = selectedRole && selectedRole.isActive;
              
              return (
                <>
                  {!isSelectedRoleActive && (
                    <div style={{ color: "#dc2626", fontSize: "0.9rem", padding: "0.5rem", backgroundColor: "#fee2e2", borderRadius: "4px", marginBottom: "0.5rem" }}>
                      ⚠️ The selected replacement role is inactive. You cannot make an inactive role the new default.
                    </div>
                  )}
                  <label className="checkbox-label" style={{ opacity: isSelectedRoleActive ? 1 : 0.5 }}>
                    <input
                      type="checkbox"
                      checked={replacementMakeDefault === true}
                      disabled={!isSelectedRoleActive}
                      onChange={(e) => {
                        if (isSelectedRoleActive) {
                          console.log("☑️ Default checkbox changed to:", e.target.checked);
                          setReplacementMakeDefault(e.target.checked);
                        }
                      }}
                    />
                    Do you want to make the replacement role the new default?
                  </label>
                </>
              );
            })() : (
              <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                Select a replacement role first to enable the option to make it the new default.
              </div>
            )}
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>
              Note: if you leave the replacement field empty, affected users will not be reassigned to any role and no new default role will be created.
            </div>
            {deactivateModalError && (
              <div className="setup-error" style={{ marginTop: "0.5rem" }}>
                <Alert type="danger" message={deactivateModalError} />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Permissions Modal */}
      {permissionsModalOpen && (
        <PermissionsModal
          isOpen={permissionsModalOpen}
          role={editingRole}
          onClose={closePermissionsModal}
          onSaveSuccess={handlePermissionsSaveSuccess}
        />
      )}
    </div>
  );
};

export default RoleRightsTab;
