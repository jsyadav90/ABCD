/**
 * Page: Users List
 * Description: Users ka paginated list, branch filter, aur bulk/user actions manage karta hai.
 * Major Logics:
 * - All users fetch + selected branch ke hisaab se client-side filter
 * - Role change, manager assign, enable/disable, password change ke modals
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth.js";
import Table from "../../../components/Table/Table.jsx";
import Button from "../../../components/Button/Button.jsx";
import Input from "../../../components/Input/Input.jsx";
import Modal from "../../../components/Modal/Modal.jsx";
import FilterPopup from "../../../components/Filter/FilterPopup.jsx";
import FilterDisplay from "../../../components/Filter/FilterDisplay.jsx";
import { hasPermission } from "../../../utils/permissionHelper";
import { PERMISSION_MODULES, MAIN_MODULES } from "../../../constants/permissions";
import { PageLoader } from "../../../components/Loader/Loader.jsx";
import StatusChangeModal from "../../../components/StatusChangeModal/StatusChangeModal.jsx";
import "./Users.css";
import {
  fetchAllUsers,
  disableUser,
  enableUser,
  toggleCanLogin,
  changeUserPassword,
  changeUserRole,
  updateUser,
  fetchRolesForDropdown,
  fetchUsersForDropdown,
  fetchBranchesForDropdown,
} from "../../../services/userApi.js";
import { authAPI } from "../../../services/api.js";
import Select from "../../../components/Select/Select.jsx";
import MultiSelect from "../../../components/Select/MultiSelect.jsx";
import { SetPageTitle } from "../../../components/SetPageTitle/SetPageTitle.jsx";
import { getSelectedBranch, onBranchChange } from "../../../utils/scope";
import { validatePasswordInput } from "../../../utils/passwordPolicy";

const Users = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [allUsers, setAllUsers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const bulkActionsRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Change password modal state
  const [changePasswordModal, setChangePasswordModal] = useState({
    isOpen: false,
    mongoId: null,
    displayUserId: null,
    userName: null,
    newPassword: "",
    passwordError: "",
    isSubmitting: false,
    showPassword: false,
  });

  // Dropdown data
  const [roles, setRoles] = useState([]);
  const [potentialManagers, setPotentialManagers] = useState([]);

  // Edit Role Modal State
  const [editRoleModal, setEditRoleModal] = useState({
    isOpen: false,
    userId: null,
    userName: "",
    currentRoleId: "",
    newRoleId: "",
    activeTab: "role", // "role", "modules", or "otherRights"
    extraPermissions: [],
    removedPermissions: [],
    assignedPermissions: [], // Current assigned permissions for UI
    expandedModules: {},
    searchTerm: "",
    selectedModuleKey: "all", // For filtering permissions
    selectedCategoryKey: "all", // For filtering permissions
    selectedModules: [], // User's assigned modules
    roleModules: [], // Role's assigned modules
    extraModules: [], // Extra modules assigned to user beyond role
    removedModules: [], // Modules removed from role for user
    isSubmitting: false,
    error: ""
  });

  // Assign Reporting Modal State
  const [assignReportingModal, setAssignReportingModal] = useState({
    isOpen: false,
    userId: null,
    userName: "",
    currentManagerId: "",
    newManagerId: "",
    isSubmitting: false,
    error: ""
  });

  // Status Change Modal State
  const [statusChangeModal, setStatusChangeModal] = useState({
    isOpen: false,
    userId: null,
    entityType: 'user',
    entityName: null,
    newStatus: null,
  });

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilterBranch, setAppliedFilterBranch] = useState("ALL");
  const [appliedFilterStatus, setAppliedFilterStatus] = useState("ACTIVE");
  const [appliedFilterRole, setAppliedFilterRole] = useState("ALL");
  const [appliedFilterCanLogin, setAppliedFilterCanLogin] = useState("ALL");
  const [pendingFilterBranch, setPendingFilterBranch] = useState("ALL");
  const [pendingFilterStatus, setPendingFilterStatus] = useState("ACTIVE");
  const [pendingFilterRole, setPendingFilterRole] = useState("ALL");
  const [pendingFilterCanLogin, setPendingFilterCanLogin] = useState("ALL");
  const [branches, setBranches] = useState([]);
  const [userBranchIds, setUserBranchIds] = useState([]);
  const filterButtonRef = useRef(null);

  const pageSize = Number(import.meta.env.VITE_PAGE_SIZE || import.meta.env.page_size) || 20;
  const [selectedBranch, setSelectedBranch] = useState(getSelectedBranch() || "");
  const [visibleUsers, setVisibleUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all users by paging until complete
        const data = await fetchAllUsers(Number(import.meta.env.VITE_API_TABLE_SIZE) || 100000);
        setAllUsers(data);
      } catch (error) {
        console.error("Failed to fetch users", error);
        setError(error.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    const off = onBranchChange((branchId) => {
      setSelectedBranch(branchId || "");
    });
    return off;
  }, []);

  // Load branches and sync pending filters when filter opens
  useEffect(() => {
    if (isFilterOpen) {
      setPendingFilterStatus(appliedFilterStatus);
      setPendingFilterBranch(appliedFilterBranch);
      setPendingFilterRole(appliedFilterRole);
      setPendingFilterCanLogin(appliedFilterCanLogin);
    }
  }, [isFilterOpen, appliedFilterStatus, appliedFilterBranch, appliedFilterRole, appliedFilterCanLogin]);

  // Load branches and user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const resp = await authAPI.getProfile();
        const userInfo = resp.data?.data?.user || {};
        
        // Get user's assigned branches
        const rawBranchList = Array.isArray(userInfo.branchId)
          ? userInfo.branchId
          : Array.isArray(userInfo.branchIds)
            ? userInfo.branchIds
            : [];
        const branchIds = rawBranchList.map((b) => {
          if (!b && b !== 0) return '';
          if (typeof b === 'object') {
            if (b._id) return String(b._id);
            if (b.id) return String(b.id);
            return String(b);
          }
          return String(b);
        }).filter(Boolean);
        setUserBranchIds(branchIds);
        
        // Load branches for this organization
        if (userInfo.organizationId) {
          const branchesData = await fetchBranchesForDropdown(userInfo.organizationId);
          setBranches(branchesData && branchesData.length > 0 ? branchesData : []);
        } else {
          console.warn("No organizationId found in user profile");
        }
      } catch (err) {
        console.error("Failed to load user profile or branches", err);
        setBranches([]);
        setUserBranchIds([]);
      }
    };
    
    loadUserProfile();
  }, []);

  // Load roles on component mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesData = await fetchRolesForDropdown();
        setRoles(rolesData);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };
    loadRoles();
  }, []);

  useEffect(() => {
    if (!selectedBranch || selectedBranch === "__ALL__") {
      setVisibleUsers(allUsers);
      return;
    }
    const filtered = allUsers.filter((u) => {
      const ids = Array.isArray(u.branchId) ? u.branchId : [];
      return ids.some((b) => {
        const id = typeof b === "object" && b?._id ? String(b._id) : String(b);
        return id === selectedBranch;
      });
    });
    setVisibleUsers(filtered);
  }, [selectedBranch, allUsers]);

  // Removed realtime subscription

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is not on hamburger menu or dropdown
      if (!e.target.closest(".action-menu-container")) {
        setOpenMenuId(null);
      }
      // Check if click is not on bulk actions or dropdown
      if (!e.target.closest(".bulk-actions-container")) {
        setBulkActionsOpen(false);
      }
    };

    if (openMenuId || bulkActionsOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId, bulkActionsOpen]);

  // Auto-hide error message after 3 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

// Update assignedPermissions when role changes (for permissions tab)
  useEffect(() => {
    if (editRoleModal.isOpen && editRoleModal.newRoleId) {
      const role = roles.find(r => r._id === editRoleModal.newRoleId);
      const rolePerms = role ? role.permissionKeys || [] : [];
      const effectivePerms = [...new Set([...rolePerms, ...editRoleModal.extraPermissions].filter(p => !editRoleModal.removedPermissions.includes(p)))];

      setEditRoleModal(prev => ({
        ...prev,
        assignedPermissions: effectivePerms,
        searchTerm: "",
        selectedModuleKey: "all",
        selectedCategoryKey: "all"
      }));
    }
  }, [editRoleModal.newRoleId, editRoleModal.extraPermissions, editRoleModal.removedPermissions, roles, editRoleModal.isOpen]);

  // Filtered modules for permissions UI
  const filteredModules = useMemo(() => {
    if (!editRoleModal.searchTerm.trim()) return PERMISSION_MODULES;

    const searchLower = editRoleModal.searchTerm.toLowerCase();
    return PERMISSION_MODULES.map(module => {
      const filteredPages = module.pages.map(page => {
        const filteredActions = page.actions.filter(action =>
          action.label.toLowerCase().includes(searchLower) ||
          page.label.toLowerCase().includes(searchLower) ||
          module.label.toLowerCase().includes(searchLower)
        );
        return filteredActions.length > 0 ? { ...page, actions: filteredActions } : null;
      }).filter(Boolean);

      return filteredPages.length > 0 ? { ...module, pages: filteredPages } : null;
    }).filter(Boolean);
  }, [editRoleModal.searchTerm]);

  // Available permission modules based on user's assigned modules
  const availablePermissionModules = useMemo(() => {
    if (editRoleModal.selectedModules.length === 0) {
      return [];
    }

    const allowedSubModules = new Set(
      MAIN_MODULES.filter((module) => editRoleModal.selectedModules.includes(module.key))
        .flatMap((module) => module.subModules)
    );

    return PERMISSION_MODULES.filter((module) => allowedSubModules.has(module.key));
  }, [editRoleModal.selectedModules]);

  // Module options for the select dropdown
  const moduleOptions = useMemo(() => [
    { key: "all", label: "All Assigned Modules" },
    ...MAIN_MODULES.filter((module) => editRoleModal.selectedModules.includes(module.key)).map((module) => ({
      key: module.key,
      label: module.label,
    })),
  ], [editRoleModal.selectedModules]);

  // Category options for the select dropdown
  const categoryOptions = useMemo(() => {
    const options = [{ key: "all", label: "All Categories" }];

    if (editRoleModal.selectedModuleKey === "all") {
      availablePermissionModules.forEach(module => {
        options.push({ key: module.key, label: module.label });
      });
    } else {
      const mainModule = MAIN_MODULES.find(m => m.key === editRoleModal.selectedModuleKey);
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
  }, [editRoleModal.selectedModuleKey, availablePermissionModules]);

  // Final filtered modules based on all filters
  const finalFilteredModules = useMemo(() => {
    let modules = editRoleModal.searchTerm.trim() ? filteredModules : availablePermissionModules;

    if (editRoleModal.selectedModuleKey !== "all") {
      // When specific main module selected, show its submodules
      const mainModule = MAIN_MODULES.find(m => m.key === editRoleModal.selectedModuleKey);
      if (mainModule) {
        modules = modules.filter(module => mainModule.subModules.includes(module.key));
      }
    }

    if (editRoleModal.selectedCategoryKey !== "all") {
      modules = modules.filter(module => module.key === editRoleModal.selectedCategoryKey);
    }

    return modules;
  }, [editRoleModal.searchTerm, editRoleModal.selectedModuleKey, editRoleModal.selectedCategoryKey, filteredModules, availablePermissionModules]);

  const handleDisableRow = (id) => {
    const user = allUsers.find((u) => u._id === id);
    setStatusChangeModal({
      isOpen: true,
      userId: id,
      entityType: 'user',
      entityName: user?.name || user?.displayUserId || "this user",
      newStatus: false,
    });
  };

  const handleToggleLogin = async (id, canLogin) => {
    const action = canLogin ? "enable login for" : "disable login for";
    const confirmed = window.confirm(`Are you sure you want to ${action} this user?`);
    if (!confirmed) return;

    try {
      const user = allUsers.find((u) => u._id === id);
      if (canLogin) {
        const hasRole = !!(user?.roleId || user?.role);
        const hasBranch = Array.isArray(user?.branchId)
          ? user.branchId.length > 0
          : !!user?.branchId;

        if (!hasRole || !hasBranch) {
          const missing = [];
          if (!hasRole) missing.push("role");
          if (!hasBranch) missing.push("branch");
          throw new Error(
            `Cannot enable login: user must have ${missing.join(" and ")} assigned before login can be enabled.`
          );
        }
      }

      setLoading(true);
      setError(null);
      const res = await toggleCanLogin(id, canLogin);

      // Update local state: reflect canLogin and if backend returned login credentials attach them
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === id
            ? {
                ...u,
                canLogin: canLogin,
                // if backend returned a login object, merge username info
                ...(res?.login ? { loginInfo: res.login } : {}),
              }
            : u,
        ),
      );
    } catch (err) {
      console.error("Toggle login failed", err);
      setError(err.message || "Failed to toggle login");
    } finally {
      setLoading(false);
    }
  };

  const handleLockAccount = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to lock this user account? This will prevent the user from logging in."
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      await authAPI.lockAccount(id, "Manual lock by admin");

      // Update local state: set isLocked to true
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === id
            ? {
                ...u,
                isLocked: true,
                lockLevel: 3, // Permanent lock
              }
            : u,
        ),
      );
      setSuccessMessage("Account locked successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Lock account failed", err);
      setError(err.message || "Failed to lock account");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAccount = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to unlock this user account?"
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      await authAPI.unlockAccount(id);

      // Update local state: set isLocked to false and reset lock fields
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === id
            ? {
                ...u,
                isLocked: false,
                lockLevel: 0,
                failedLoginAttempts: 0,
              }
            : u,
        ),
      );
      setSuccessMessage("Account unlocked successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Unlock account failed", err);
      setError(err.message || "Failed to unlock account");
    } finally {
      setLoading(false);
    }
  };

  const handleEnableRow = (id) => {
    const user = allUsers.find((u) => u._id === id);
    setStatusChangeModal({
      isOpen: true,
      userId: id,
      entityType: 'user',
      entityName: user?.name || user?.displayUserId || "this user",
      newStatus: true,
    });
  };

  const handleStatusChangeConfirm = async (reason) => {
    const { userId, newStatus } = statusChangeModal;
    const user = allUsers.find((u) => u._id === userId);

    try {
      setLoading(true);
      setError(null);

      if (!newStatus) {
        // Disabling user
        // Step 1: If user has canLogin enabled, disable it first
        if (user?.canLogin) {
          await toggleCanLogin(userId, false);
        }
        // Step 2: Deactivate user (isActive: false)
        await disableUser(userId, reason);
        setAllUsers((prev) =>
          prev.map((u) =>
            u._id === userId
              ? { ...u, isActive: false, status: "Inactive", canLogin: false }
              : u,
          ),
        );
      } else {
        // Enabling user
        await enableUser(userId, reason);
        setAllUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, isActive: true, status: "Active" } : u,
          ),
        );
      }
    } catch (err) {
      console.error("Status change failed", err);
      setError(err.message || "Failed to change user status");
    } finally {
      setLoading(false);
      setStatusChangeModal({ isOpen: false, userId: null, entityType: 'user', entityName: null, newStatus: null });
    }
  };

  const handleStatusChangeCancel = () => {
    setStatusChangeModal({ isOpen: false, userId: null, entityType: 'user', entityName: null, newStatus: null });
  };

  // Open change password modal
  const handleOpenChangePasswordModal = (mongoId, displayUserId, userName) => {
    setChangePasswordModal({
      isOpen: true,
      mongoId,
      displayUserId,
      userName,
      newPassword: "",
      passwordError: "",
      isSubmitting: false,
      showPassword: false,
    });
    setOpenMenuId(null);
  };

  // Close change password modal
  const handleCloseChangePasswordModal = () => {
    setChangePasswordModal({
      isOpen: false,
      mongoId: null,
      displayUserId: null,
      userName: null,
      newPassword: "",
      passwordError: "",
      isSubmitting: false,
      showPassword: false,
    });
  };

  // Handle change password submission
  const handleChangePasswordSubmit = async () => {
    // Validation
    if (!changePasswordModal.newPassword) {
      setChangePasswordModal((prev) => ({
        ...prev,
        passwordError: "Password is required",
      }));
      return;
    }

    const passwordError = validatePasswordInput(changePasswordModal.newPassword, [
      changePasswordModal.displayUserId,
      changePasswordModal.userName,
    ]);
    if (passwordError) {
      setChangePasswordModal((prev) => ({
        ...prev,
        passwordError,
      }));
      return;
    }

    try {
      setChangePasswordModal((prev) => ({
        ...prev,
        isSubmitting: true,
        passwordError: "",
      }));

      await changeUserPassword(
        changePasswordModal.mongoId,
        changePasswordModal.newPassword,
      );

      setSuccessMessage(`Password changed for ${changePasswordModal.userName}`);
      handleCloseChangePasswordModal();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Change password failed", err);
      setChangePasswordModal((prev) => ({
        ...prev,
        passwordError: err.message || "Failed to change password",
      }));
    } finally {
      setChangePasswordModal((prev) => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  };

  // --- Edit Role Handlers ---
  const handleOpenEditRole = async (row) => {
    // Get current role permissions for initial display
    const currentRoleId = row.roleId?._id || row.roleId || "";
    const role = roles.find(r => r._id === currentRoleId);
    const rolePerms = role
      ? role.permissionKeys || []
      : Array.isArray(row.roleId?.permissionKeys)
        ? row.roleId.permissionKeys
        : [];
    const extraPerms = row.extraPermissions || [];
    const removedPerms = row.removedPermissions || [];
    const effectivePerms = [...new Set([...rolePerms, ...extraPerms].filter(p => !removedPerms.includes(p)))];

    const removedModules = Array.isArray(row.removedModules) ? row.removedModules : [];
    const roleModules = Array.isArray(role?.modules) ? role.modules : [];
    // row.modules is the effective modules (transformed in userApi.js)
    const effectiveModules = Array.isArray(row.modules) ? row.modules : [];
    // row.extraModules is the extra modules (preserved in userApi.js)
    const extraModules = Array.isArray(row.extraModules) ? row.extraModules : [];

    setEditRoleModal({
      isOpen: true,
      userId: row._id,
      userName: row.name,
      currentRoleId,
      newRoleId: currentRoleId,
      activeTab: "role",
      extraPermissions: extraPerms,
      removedPermissions: removedPerms,
      assignedPermissions: effectivePerms, // Show role permissions as checked by default
      expandedModules: {},
      searchTerm: "",
      selectedModuleKey: "all",
      selectedCategoryKey: "all",
      selectedModules: effectiveModules, // Use effective modules
      roleModules: roleModules, // Role's assigned modules
      extraModules: extraModules, // Extra modules beyond role
      removedModules,
      isSubmitting: false,
      error: ""
    });
    setOpenMenuId(null);
    if (roles.length === 0) {
        try {
            const data = await fetchRolesForDropdown();
            setRoles(data);
        } catch(e) { console.error(e); }
    }
  };

  const handleSubmitEditRole = async () => {
    if (!editRoleModal.newRoleId) {
        setEditRoleModal(prev => ({...prev, error: "Please select a role"}));
        return;
    }

    // If we're on the modules tab, save modules
    if (editRoleModal.activeTab === "modules") {
      await handleSaveModules();
      return;
    }

    // If we're on the otherRights tab, save permissions
    if (editRoleModal.activeTab === "otherRights") {
      await handleSavePermissions();
      return;
    }

    // Otherwise, just save the role change
    const confirmed = window.confirm("Are you sure you want to update this user's role?");
    if (!confirmed) return;

    try {
        setEditRoleModal(prev => ({...prev, isSubmitting: true, error: ""}));
        await changeUserRole(editRoleModal.userId, editRoleModal.newRoleId);
        
        // Update local state
        const roleObj = roles.find(r => r._id === editRoleModal.newRoleId);
        setAllUsers(prev => prev.map(u => u._id === editRoleModal.userId ? { ...u, roleId: roleObj, role: roleObj?.displayName || roleObj?.name } : u));
        
        setSuccessMessage("Role updated successfully");
        setEditRoleModal(prev => ({...prev, isOpen: false}));
        setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
        setEditRoleModal(prev => ({...prev, isSubmitting: false, error: err.message}));
    }
  };

  const handleRoleChange = (newRoleId) => {
    // When role changes, compute new effective modules: new role modules + user extra modules - user removed modules
    const selectedRole = roles.find(r => r._id === newRoleId);
    const newRoleModules = Array.isArray(selectedRole?.modules) ? selectedRole.modules : [];
    const userExtraModules = Array.isArray(editRoleModal.extraModules) ? editRoleModal.extraModules : [];
    const userRemovedModules = Array.isArray(editRoleModal.removedModules) ? editRoleModal.removedModules : [];
    const newEffectiveModules = Array.from(new Set([...newRoleModules, ...userExtraModules])).filter(
      (moduleKey) => !userRemovedModules.includes(moduleKey)
    );

    setEditRoleModal(prev => ({
      ...prev,
      newRoleId,
      roleModules: newRoleModules,
      selectedModules: newEffectiveModules,
      error: ""
    }));
  };

  // --- Assign Reporting Handlers ---
  const handleOpenAssignReporting = async (row) => {
      setAssignReportingModal({
        isOpen: true,
        userId: row._id,
        userName: row.name,
        currentManagerId: row.reportingTo || "",
        newManagerId: row.reportingTo || "",
        isSubmitting: false,
        error: ""
      });
      setOpenMenuId(null);
      if (potentialManagers.length === 0) {
          try {
              const data = await fetchUsersForDropdown(currentUser?.organizationId || '6991f27977da956717ec33f5'); 
              setPotentialManagers(data);
          } catch(e) { console.error(e); }
      }
  };

  const handleSubmitAssignReporting = async () => {
      try {
        setAssignReportingModal(prev => ({...prev, isSubmitting: true, error: ""}));
        // Send reportingTo (null if empty string)
        await updateUser(assignReportingModal.userId, { reportingTo: assignReportingModal.newManagerId || null });
        
        // Update local state
        // @ts-ignore
        setAllUsers(prev => prev.map(u => u._id === assignReportingModal.userId ? { ...u, reportingTo: assignReportingModal.newManagerId || null } : u));
        
        setSuccessMessage("Reporting manager updated successfully");
        setAssignReportingModal(prev => ({...prev, isOpen: false}));
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setAssignReportingModal(prev => ({...prev, isSubmitting: false, error: err.message}));
      }
  };

  // Permission handling functions for inline permissions UI
  const toggleModuleExpand = (moduleKey) => {
    setEditRoleModal(prev => ({
      ...prev,
      expandedModules: {
        ...prev.expandedModules,
        [moduleKey]: !prev.expandedModules[moduleKey]
      }
    }));
  };

  const togglePermission = (permissionKey) => {
    setEditRoleModal(prev => {
      const isCurrentlyAssigned = prev.assignedPermissions.includes(permissionKey);
      const newAssignedPermissions = isCurrentlyAssigned
        ? prev.assignedPermissions.filter(p => p !== permissionKey)
        : [...prev.assignedPermissions, permissionKey];

      return {
        ...prev,
        assignedPermissions: newAssignedPermissions
      };
    });
  };

  const handlePermissionSearch = (searchTerm) => {
    setEditRoleModal(prev => ({ ...prev, searchTerm }));
  };

  const handleModulesTabClick = () => {
    // When clicking modules tab, just switch to the tab - modules are already set correctly
    setEditRoleModal(prev => ({
      ...prev,
      activeTab: "modules"
    }));
  };

  const handleModuleFilter = (moduleKey) => {
    setEditRoleModal(prev => ({
      ...prev,
      selectedModuleKey: moduleKey,
      selectedCategoryKey: "all" // Reset category when module changes
    }));
  };

  const handleCategoryFilter = (categoryKey) => {
    setEditRoleModal(prev => ({ ...prev, selectedCategoryKey: categoryKey }));
  };

  const handleSavePermissions = async () => {
    const confirmed = window.confirm("Are you sure you want to save permission changes for this user?");
    if (!confirmed) return;

    try {
      setEditRoleModal(prev => ({ ...prev, isSubmitting: true, error: "" }));

      // Get current role permissions
      const role = roles.find(r => r._id === editRoleModal.newRoleId);
      const rolePerms = role ? role.permissionKeys || [] : [];

      // Calculate extra and removed permissions
      const extraPermissions = editRoleModal.assignedPermissions.filter(p => !rolePerms.includes(p));
      const removedPermissions = rolePerms.filter(p => !editRoleModal.assignedPermissions.includes(p));

      // Save the changes
      const response = await changeUserRole(editRoleModal.userId, editRoleModal.newRoleId, extraPermissions, removedPermissions);
      console.log("Permission save response:", response);

      // Update local state
      setAllUsers(prev => prev.map(u =>
        u._id === editRoleModal.userId
          ? { ...u, roleId: editRoleModal.newRoleId, extraPermissions, removedPermissions }
          : u
      ));

      setSuccessMessage("User role and permissions updated successfully");
      setEditRoleModal(prev => ({ ...prev, isOpen: false, isSubmitting: false }));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving permissions:", err);
      setEditRoleModal(prev => ({ ...prev, isSubmitting: false, error: err.message || "Failed to save permissions" }));
    }
  };

  const handleSaveModules = async () => {
    const confirmed = window.confirm("Are you sure you want to save module changes for this user?");
    if (!confirmed) return;

    try {
      setEditRoleModal(prev => ({ ...prev, isSubmitting: true, error: "" }));

      const roleModules = editRoleModal.roleModules || [];
      const extraModules = editRoleModal.selectedModules.filter(m => !roleModules.includes(m));
      const removedModules = roleModules.filter(m => !editRoleModal.selectedModules.includes(m));

      // Save module overrides using the same route as other rights
      const response = await changeUserRole(editRoleModal.userId, editRoleModal.newRoleId, null, null, extraModules, removedModules);
      console.log("Module save response:", response);

      // Update local state with effective modules
      setAllUsers(prev => prev.map(u =>
        u._id === editRoleModal.userId
          ? { ...u, modules: editRoleModal.selectedModules, extraModules: extraModules, removedModules: removedModules }
          : u
      ));

      setSuccessMessage("User modules updated successfully");
      setEditRoleModal(prev => ({ ...prev, isOpen: false, isSubmitting: false }));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving modules:", err);
      setEditRoleModal(prev => ({ ...prev, isSubmitting: false, error: err.message || "Failed to save modules" }));
    }
  };

  // Highlight text utility function
  const highlightText = (text, searchValue) => {
    if (!searchValue) return text;
    const regex = new RegExp(`(${searchValue})`, "gi");
    return String(text)
      .split(regex)
      .map((part, index) =>
        part.toLowerCase() === searchValue.toLowerCase() ? (
          <span key={index} className="highlight">
            {part}
          </span>
        ) : (
          part
        ),
      );
  };

  // Helper function to get branch display name
  const getBranchDisplayName = useCallback((branchId) => {
    if (!branchId || branchId === "ALL") return "All Branches";
    const branch = branches.find(b => {
      const bid = typeof b === "object" && b?._id ? String(b._id) : String(b);
      return bid === String(branchId);
    });
    if (!branch) return branchId;
    return typeof branch === "object" 
      ? (branch.branchName || branch.name || String(branchId))
      : String(branch);
  }, [branches]);

  // Get active filters to display
  const getActiveFilters = useCallback(() => {
    const filters = [];
    
    // Branch: show if not "ALL" (default)
    if (appliedFilterBranch !== "ALL") {
      filters.push({
        label: "Branch",
        value: getBranchDisplayName(appliedFilterBranch),
      });
    }
    
    // Status: always show (applied by default as ACTIVE)
    filters.push({
      label: "Status",
      value: appliedFilterStatus,
    });
    
    // Role: show if not "ALL" (default)
    if (appliedFilterRole !== "ALL") {
      const role = roles.find(r => r._id === appliedFilterRole);
      filters.push({
        label: "Role",
        value: role ? (role.displayName || role.name) : appliedFilterRole,
      });
    }
    
    // Can Login: show if not "ALL" (default)
    if (appliedFilterCanLogin !== "ALL") {
      const displayValue = appliedFilterCanLogin === "YES" ? "Yes" : "No";
      filters.push({
        label: "Can Login",
        value: displayValue,
      });
    }
    
    return filters;
  }, [appliedFilterBranch, appliedFilterStatus, appliedFilterRole, appliedFilterCanLogin, roles, getBranchDisplayName]);

  // Option renderers and memos
  const branchOptions = useMemo(() => {
    const options = [];
    
    if (branches && branches.length > 0) {
      options.push("ALL");
      branches.forEach((b) => {
        const branchId = typeof b === "object" && b?._id ? String(b._id) : String(b);
        const branchName = typeof b === "object" ? (b.branchName || b.name || branchId) : String(b);
        if (branchId) {
          options.push(branchId);
        }
      });
    } else {
      options.push("ALL");
    }
    
    return options;
  }, [branches]);

  const statusOptions = useMemo(() => ["ACTIVE", "INACTIVE", "ALL"], []);

  const roleOptions = useMemo(() => {
    if (roles.length === 0) return ["ALL"];
    return ["ALL", ...roles.map(r => r._id)];
  }, [roles]);

  const canLoginOptions = useMemo(() => ["ALL", "YES", "NO"], []);

  // Apply filters to visibleUsers
  const filteredUsers = useMemo(() => {
    let result = visibleUsers;

    

    // Filter by Branch
    if (appliedFilterBranch !== "ALL") {
      result = result.filter(u => {
        const ids = Array.isArray(u.branchId) ? u.branchId : [];
        return ids.some(b => {
          const bid = typeof b === "object" && b?._id ? String(b._id) : String(b);
          return bid === String(appliedFilterBranch);
        });
      });
    }

    // Filter by Role
    if (appliedFilterRole !== "ALL") {
      result = result.filter(u => {
        const roleId = typeof u.roleId === "object" ? u.roleId?._id : u.roleId;
        return roleId === appliedFilterRole;
      });
    }

    // Filter by Can Login
    if (appliedFilterCanLogin === "YES") {
      result = result.filter(u => u.canLogin === true);
    } else if (appliedFilterCanLogin === "NO") {
      result = result.filter(u => u.canLogin !== true);
    }

    // Filter by Status
    if (appliedFilterStatus === "ACTIVE") {
      result = result.filter(u => u.isActive !== false);
    } else if (appliedFilterStatus === "INACTIVE") {
      result = result.filter(u => u.isActive === false);
    }

    return result;
  }, [visibleUsers, appliedFilterStatus, appliedFilterBranch, appliedFilterRole, appliedFilterCanLogin]);

  const columns = [
    {
      header: "User ID",
      key: "userId",
      sortable: true,
      render: (row, search) => (
        <button
          className="user-link"
          onClick={() => navigate(`/user-detail/${row._id}`)}
          title="View user details"
        >
          {highlightText(row.userId, search)}
        </button>
      ),
    },
    {
      header: "Full Name",
      key: "name",
      sortable: true,
      render: (row, search) => (
        <button
          className="user-link"
          onClick={() => navigate(`/user-detail/${row._id}`)}
          title="View user details"
        >
          {highlightText(row.name, search)}
        </button>
      ),
    },
    { header: "Designation", key: "designation", sortable: true, },
    { header: "Department", key: "department", sortable: true, },
    { header: "Branch", key: "branch", sortable: true, },
    { header: "Gender", key: "gender", sortable: true, },
    { header: "Email", key: "email", sortable: true, },
    { header: "Phone no", key: "phone_no", sortable: true, },
    { header: "Role", key: "role", sortable: true, },
    { header: "Status", key: "status", sortable: true, },
    {
      header: "Can Login",
      key: "canLogin",
      sortable: true,
      render: (row) => {
        if (row.isLocked) return "Locked";
        return row.canLogin ? "Yes" : "No";
      },
    },
    // { header: "Remarks", key: "remarks" },
    {
      header: "Actions",
      key: "actions",
      render: (row) => (
        <div className="action-menu-container">
          {/* View Button */}
          <button
            className="action-btn action-btn--view"
            onClick={() => navigate(`/user-detail/${row._id}`)}
            title="View user details"
          >
            <span className="material-icons">visibility</span>
          </button>

          <button
            className="hamburger-btn"
            onClick={() =>
              setOpenMenuId(openMenuId === row._id ? null : row._id)
            }
            title="More actions"
          >
            <span className="material-icons">more_vert</span>
          </button>

          {openMenuId === row._id && (
            <div className="action-dropdown-menu">

              {hasPermission("users:rows_buttons:edit") && (
                <button
                  className="action-menu-item"
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    navigate(`/users/edit/${row._id}${params.toString() ? `?${params.toString()}` : ''}`);
                    setOpenMenuId(null);
                  }}
                >
                  Edit
                </button>
              )}
              
              {hasPermission("users:rows_buttons:edit_role") && (
                <button
                  className="action-menu-item"
                  onClick={() => handleOpenEditRole(row)}
                >
                  Edit Role
                </button>
              )}

              {hasPermission("users:rows_buttons:assign_reporting") && (
                <button
                  className="action-menu-item"
                  onClick={() => handleOpenAssignReporting(row)}
                >
                  Reporting To
                </button>
              )}

              {String(row._id) !== String(currentUser?.id) && (
                <>
                  {!row.isActive ? (
                    <>
                      {hasPermission("users:rows_buttons:enable") && (
                        <button
                          className="action-menu-item action-menu-item--success"
                          onClick={() => {
                            handleEnableRow(row._id);
                            setOpenMenuId(null);
                          }}
                        >
                          Active
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {hasPermission("users:rows_buttons:disable") && (
                        <button
                          className="action-menu-item action-menu-item--danger"
                          onClick={() => {
                            handleDisableRow(row._id);
                            setOpenMenuId(null);
                          }}
                        >
                          Inactive
                        </button>
                      )}
                      {row.canLogin && !row.isLocked ? (
                        <>
                          {hasPermission("users:rows_buttons:disable_login") && (
                            <button
                              className="action-menu-item action-menu-item--warning"
                              onClick={() => {
                                handleToggleLogin(row._id, false);
                                setOpenMenuId(null);
                              }}
                            >
                              Disable Login
                            </button>
                          )}
                        </>
                      ) : !row.isLocked && (
                        <>
                          {hasPermission("users:rows_buttons:enable_login") && (
                            <button
                              className="action-menu-item action-menu-item--success"
                              onClick={() => {
                                handleToggleLogin(row._id, true);
                                setOpenMenuId(null);
                              }}
                            >
                              Enable Login
                            </button>
                          )}
                        </>
                      )}

                      {/* Lock/Unlock buttons */}
                      {row.canLogin && !row.isLocked && hasPermission("users:rows_buttons:lock_account") && (
                        <button
                          className="action-menu-item action-menu-item--danger"
                          onClick={() => {
                            handleLockAccount(row._id);
                            setOpenMenuId(null);
                          }}
                        >
                          Lock Login
                        </button>
                      )}

                      {row.isLocked && hasPermission("users:rows_buttons:unlock_account") && (
                        <button
                          className="action-menu-item action-menu-item--success"
                          onClick={() => {
                            handleUnlockAccount(row._id);
                            setOpenMenuId(null);
                          }}
                        >
                          Unlock Login
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {row.canLogin && !row.isLocked && hasPermission("users:rows_buttons:change_password") && (
                <button
                  className="action-menu-item action-menu-item--info"
                  onClick={() => {
                    handleOpenChangePasswordModal(
                      row._id,
                      row.userId,
                      row.name,
                    );
                    setOpenMenuId(null);
                  }}
                >
                  Change Password
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  // Filter fields configuration
  // Determine if branch field should be shown:
  // - Single branch user: never show (filtered by that branch only)
  // - Multi-branch user with "ALL" selected: show branch field
  // - Multi-branch user with specific branch selected: never show
  const shouldShowBranchField = branches.length > 1 && (!selectedBranch || selectedBranch === "__ALL__" || selectedBranch === "");

  const filterFields = [
    ...(shouldShowBranchField ? [
      {
        key: 'branch',
        label: 'Branch',
        type: 'select',
        value: pendingFilterBranch,
        onChange: (e) => setPendingFilterBranch(e.target.value),
        options: branchOptions,
        optionRenderer: getBranchDisplayName,
      }
    ] : []),
    
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      value: pendingFilterRole,
      onChange: (e) => setPendingFilterRole(e.target.value),
      options: roleOptions,
      optionRenderer: (roleId) => {
        if (roleId === "ALL") return "All";
        const role = roles.find(r => r._id === roleId);
        return role ? (role.displayName || role.name) : roleId;
      },
    },
    {
      key: 'canLogin',
      label: 'Can Login',
      type: 'select',
      value: pendingFilterCanLogin,
      onChange: (e) => setPendingFilterCanLogin(e.target.value),
      options: canLoginOptions,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      value: pendingFilterStatus,
      onChange: (e) => setPendingFilterStatus(e.target.value),
      options: statusOptions,
    },
  ];

  const handleBulkDisable = async () => {
    if (selectedRows.length === 0) {
      setError("Please select at least one user to disable");
      return;
    }

    // Exclude current user from bulk disable
    const safeIds = selectedRows.filter((id) => String(id) !== String(currentUser?.id));
    const usersToDisable = allUsers.filter((u) => safeIds.includes(u._id));

    if (usersToDisable.length === 0) {
      setError("You cannot disable yourself. Remove yourself from selection.");
      return;
    }

    const userListText = usersToDisable
      .map((u) => `${u.name} (${u.userId})`)
      .join("\n");

    const confirmed = window.confirm(
      `Are you sure you want to disable the following users?\n\n${userListText}`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      await Promise.all(safeIds.map((id) => disableUser(id)));

      setAllUsers((prev) =>
        prev.map((u) =>
          safeIds.includes(u._id)
            ? { ...u, isActive: false, status: "Inactive", canLogin: false }
            : u,
        ),
      );

      setSelectedRows([]);
      setBulkActionsOpen(false);
      setSuccessMessage(`${safeIds.length} user(s) disabled successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Bulk disable failed", err);
      setError(err.message || "Bulk disable failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEnable = async () => {
    if (selectedRows.length === 0) {
      setError("Please select at least one user to enable");
      return;
    }

    const usersToEnable = allUsers.filter((u) => selectedRows.includes(u._id) && !u.isActive);

    if (usersToEnable.length === 0) {
      setError("No inactive users selected");
      return;
    }

    const userListText = usersToEnable
      .map((u) => `${u.name} (${u.userId})`)
      .join("\n");

    const confirmed = window.confirm(
      `Are you sure you want to enable the following users?\n\n${userListText}`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      await Promise.all(usersToEnable.map((u) => enableUser(u._id)));

      setAllUsers((prev) =>
        prev.map((u) =>
          usersToEnable.some((enabledUser) => enabledUser._id === u._id)
            ? { ...u, isActive: true, status: "Active" }
            : u,
        ),
      );

      setSelectedRows([]);
      setBulkActionsOpen(false);
      setSuccessMessage(`${usersToEnable.length} user(s) enabled successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Bulk enable failed", err);
      setError(err.message || "Bulk enable failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkLock = async () => {
    if (selectedRows.length === 0) {
      setError("Please select at least one user to lock");
      return;
    }

    // Exclude current user from bulk lock
    const safeIds = selectedRows.filter((id) => String(id) !== String(currentUser?.id));
    const usersToLock = allUsers.filter((u) => safeIds.includes(u._id) && u.canLogin && !u.isLocked);

    if (usersToLock.length === 0) {
      setError("No eligible users selected for locking. Users must be active, have login enabled, and not already locked.");
      return;
    }

    const userListText = usersToLock
      .map((u) => `${u.name} (${u.userId})`)
      .join("\n");

    const confirmed = window.confirm(
      `Are you sure you want to lock the following user accounts?\n\n${userListText}\n\nThis will permanently lock their accounts.`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      await Promise.all(usersToLock.map((u) => authAPI.lockAccount(u._id, "Bulk lock by admin")));

      setAllUsers((prev) =>
        prev.map((u) =>
          usersToLock.some((lockedUser) => lockedUser._id === u._id)
            ? { ...u, isLocked: true, lockLevel: 3 }
            : u,
        ),
      );

      setSelectedRows([]);
      setBulkActionsOpen(false);
      setSuccessMessage(`${usersToLock.length} account(s) locked successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Bulk lock failed", err);
      setError(err.message || "Bulk lock failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUnlock = async () => {
    if (selectedRows.length === 0) {
      setError("Please select at least one user to unlock");
      return;
    }

    const usersToUnlock = allUsers.filter((u) => selectedRows.includes(u._id) && u.isLocked);

    if (usersToUnlock.length === 0) {
      setError("No locked users selected for unlocking");
      return;
    }

    const userListText = usersToUnlock
      .map((u) => `${u.name} (${u.userId})`)
      .join("\n");

    const confirmed = window.confirm(
      `Are you sure you want to unlock the following user accounts?\n\n${userListText}`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      await Promise.all(usersToUnlock.map((u) => authAPI.unlockAccount(u._id)));

      setAllUsers((prev) =>
        prev.map((u) =>
          usersToUnlock.some((unlockedUser) => unlockedUser._id === u._id)
            ? { ...u, isLocked: false, lockLevel: 0, failedLoginAttempts: 0 }
            : u,
        ),
      );

      setSelectedRows([]);
      setBulkActionsOpen(false);
      setSuccessMessage(`${usersToUnlock.length} account(s) unlocked successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Bulk unlock failed", err);
      setError(err.message || "Bulk unlock failed");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading && allUsers.length === 0) {
    return <PageLoader message="Loading users..." />;
  }

  // Table handles paging/searching/sorting internally; pass full data and pageSize

  return (
    <div className="user-details-page" style={{ padding: "1rem 1rem" }}>
      <div className="users-page">
        <SetPageTitle title="Users | ABCD" />

        <div className="users-header">
          <h2>Users</h2>
          <div className="users-header__actions">
            {hasPermission("users:page_buttons:add") && (
              <Button
                onClick={() => navigate("/users/add")}
                className="users-actions__btn users-actions__btn--add"
              >
                + Add New User
              </Button>
            )}

            {/* Export Button - Protected by new permission */}
            {hasPermission("users:page_buttons:export") && (
              <Button
                onClick={() => alert("Export functionality would be triggered here")}
                className="users-actions__btn users-actions__btn--export"
                style={{ backgroundColor: "#10b981" }}
              >
                <span className="material-icons" style={{fontSize: "1.2rem", marginRight: "5px", verticalAlign: "middle"}}>download</span>
                Export Users
              </Button>
            )}

            {/* More Actions Dropdown - Always visible */}
            <div className="bulk-actions-container" ref={bulkActionsRef}>
              <Button
                onClick={() => setBulkActionsOpen(!bulkActionsOpen)}
                className="users-actions__btn users-actions__btn--secondary"
              >
                More Actions
                <span className="material-icons" style={{fontSize: "1.2rem", marginLeft: "5px", verticalAlign: "middle"}}>
                  {bulkActionsOpen ? 'expand_less' : 'expand_more'}
                </span>
              </Button>

              {bulkActionsOpen && (
                <div className="bulk-actions-dropdown">
                  {hasPermission("users:rows_buttons:disable") && (
                    <button
                      className="bulk-action-item bulk-action-item--danger"
                      onClick={handleBulkDisable}
                    >
                      <span className="material-icons">person_off</span>
                      Disable {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
                    </button>
                  )}

                  {hasPermission("users:rows_buttons:enable_login") && (
                    <button
                      className="bulk-action-item bulk-action-item--success"
                      onClick={handleBulkEnable}
                    >
                      <span className="material-icons">person_add</span>
                      Enable {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
                    </button>
                  )}

                  {hasPermission("users:rows_buttons:lock_account") && (
                    <button
                      className="bulk-action-item bulk-action-item--danger"
                      onClick={handleBulkLock}
                    >
                      <span className="material-icons">lock</span>
                      Lock Login {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
                    </button>
                  )}

                  {hasPermission("users:rows_buttons:unlock_account") && (
                    <button
                      className="bulk-action-item bulk-action-item--success"
                      onClick={handleBulkUnlock}
                    >
                      <span className="material-icons">lock_open</span>
                      Unlock {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FilterPopup Component */}
        <FilterPopup
          isOpen={isFilterOpen}
          anchorRef={filterButtonRef}
          fields={filterFields}
          onClose={() => setIsFilterOpen(false)}
          onReset={() => {
            // Reset pending filters to default values
            setPendingFilterBranch("ALL");
            setPendingFilterStatus("ACTIVE");
            setPendingFilterRole("ALL");
            setPendingFilterCanLogin("ALL");
          }}
          onApply={() => {
            // Apply pending filters and close popup
            setAppliedFilterBranch(pendingFilterBranch);
            setAppliedFilterStatus(pendingFilterStatus);
            setAppliedFilterRole(pendingFilterRole);
            setAppliedFilterCanLogin(pendingFilterCanLogin);
            setIsFilterOpen(false);
          }}
        />

        {/* Filter Display Row */}
        <FilterDisplay filters={getActiveFilters()} />

        <div className="users-table">
          <
// @ts-ignore
          Table
            columns={columns}
            data={filteredUsers}
            pageSize={pageSize}
            showSearch={true}
            showPagination={true}
            onSelectionChange={(selected) => setSelectedRows(selected)}
            isRowSelectable={(row) => String(row._id) !== String(currentUser?.id)}
            extraActions={
              <Button ref={filterButtonRef} variant="secondary" size="small" onClick={() => setIsFilterOpen((v) => !v)}>
                Filters
              </Button>
            }
          />
        </div>

        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              color: "#155724",
              padding: "12px 16px",
              borderRadius: "4px",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              minWidth: "300px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>✓</span>
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              style={{
                background: "none",
                border: "none",
                color: "#155724",
                cursor: "pointer",
                fontSize: "1.2rem",
                padding: "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.target.style.opacity = "1")}
              title="Close message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Flash Message */}
        {error && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              color: "#721c24",
              padding: "12px 16px",
              borderRadius: "4px",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              minWidth: "300px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>⚠</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                background: "none",
                border: "none",
                color: "#721c24",
                cursor: "pointer",
                fontSize: "1.2rem",
                padding: "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.target.style.opacity = "1")}
              title="Close message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Change Password Modal */}
        {changePasswordModal.isOpen && (
          <Modal
            isOpen={changePasswordModal.isOpen}
            onClose={handleCloseChangePasswordModal}
            title="Change Password"
            footer={<></>}
            className="user-page-modal"
          >
            <div style={{ padding: "1.25rem", width: "100%", maxWidth: "100%" }}>
              <h2 style={{ marginBottom: "0.5rem", marginTop: 0 }}>
                Change Password
              </h2>

              <div
                style={{
                  marginBottom: "1.5rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  fontSize: "0.875rem",
                  color: "#666",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>User ID:</span>{" "}
                  <span style={{ fontFamily: "monospace", color: "#333" }}>
                    {changePasswordModal.displayUserId}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>Name:</span>{" "}
                  {changePasswordModal.userName}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "#333",
                  }}
                >
                  New Password <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type={
                      changePasswordModal.showPassword ? "text" : "password"
                    }
                    value={changePasswordModal.newPassword}
                    onChange={(e) =>
                      setChangePasswordModal((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                        passwordError: "",
                      }))
                    }
                    placeholder="Min 8 with upper, lower, number, special"
                    disabled={changePasswordModal.isSubmitting}
                    style={{
                      width: "100%",
                      padding: "0.75rem 2.5rem 0.75rem 0.75rem",
                      border: changePasswordModal.passwordError
                        ? "1px solid #dc3545"
                        : "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "0.95rem",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setChangePasswordModal((prev) => ({
                        ...prev,
                        showPassword: !prev.showPassword,
                      }))
                    }
                    disabled={changePasswordModal.isSubmitting}
                    tabIndex="-1"
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      background: "none",
                      border: "none",
                      padding: "0.5rem",
                      cursor: changePasswordModal.isSubmitting
                        ? "not-allowed"
                        : "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "#666",
                      opacity: changePasswordModal.isSubmitting ? 0.5 : 1,
                    }}
                    title={
                      changePasswordModal.showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {changePasswordModal.showPassword ? (
                      /* Password SHOWN - Normal Icon */
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M3 12c0-4.418 4.03-8 9-8s9 3.582 9 8" />
                      </svg>
                    ) : (
                      /* Password HIDDEN - Icon with Cross Line */
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M3 12c0-4.418 4.03-8 9-8s9 3.582 9 8" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    )}
                  </button>
                </div>
                {changePasswordModal.passwordError && (
                  <div
                    style={{
                      color: "#dc3545",
                      fontSize: "0.75rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    {changePasswordModal.passwordError}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  justifyContent: "flex-end",
                  marginTop: "1.5rem",
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseChangePasswordModal}
                  disabled={changePasswordModal.isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleChangePasswordSubmit}
                  disabled={changePasswordModal.isSubmitting}
                >
                  {changePasswordModal.isSubmitting
                    ? "Changing..."
                    : "Change Password"}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Role Modal */}
        {editRoleModal.isOpen && (
          <Modal
            isOpen={editRoleModal.isOpen}
            onClose={() => setEditRoleModal(prev => ({ ...prev, isOpen: false }))}
            title="Edit User Role & Permissions"
            footer={<></>}
            size="xl"
            className="user-page-modal"
          >
             <div style={{ padding: "1rem", width: "100%", maxWidth: "100%" }}>
                <p style={{ marginBottom: "1rem" }}>User: <strong>{editRoleModal.userName}</strong></p>

                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #ddd", marginBottom: "1rem" }}>
                  <button
                    onClick={() => setEditRoleModal(prev => ({ ...prev, activeTab: "role" }))}
                    style={{
                      padding: "0.5rem 1rem",
                      border: "none",
                      background: editRoleModal.activeTab === "role" ? "#f8f9fa" : "transparent",
                      borderBottom: editRoleModal.activeTab === "role" ? "2px solid #007bff" : "none",
                      cursor: "pointer",
                      fontWeight: editRoleModal.activeTab === "role" ? "bold" : "normal"
                    }}
                  >
                    Role
                  </button>
                  <button
                    onClick={handleModulesTabClick}
                    style={{
                      padding: "0.5rem 1rem",
                      border: "none",
                      background: editRoleModal.activeTab === "modules" ? "#f8f9fa" : "transparent",
                      borderBottom: editRoleModal.activeTab === "modules" ? "2px solid #007bff" : "none",
                      cursor: "pointer",
                      fontWeight: editRoleModal.activeTab === "modules" ? "bold" : "normal"
                    }}
                  >
                    Modules
                  </button>
                  <button
                    onClick={() => setEditRoleModal(prev => ({ ...prev, activeTab: "otherRights" }))}
                    style={{
                      padding: "0.5rem 1rem",
                      border: "none",
                      background: editRoleModal.activeTab === "otherRights" ? "#f8f9fa" : "transparent",
                      borderBottom: editRoleModal.activeTab === "otherRights" ? "2px solid #007bff" : "none",
                      cursor: "pointer",
                      fontWeight: editRoleModal.activeTab === "otherRights" ? "bold" : "normal"
                    }}
                  >
                    Other Rights
                  </button>
                </div>

                {/* Role Tab */}
                {editRoleModal.activeTab === "role" && (
                  <div>
                    <div style={{ marginBottom: "1.5rem" }}>
                        <Select
                            label="Select Role"
                            name="newRoleId"
                            value={editRoleModal.newRoleId}
                            onChange={(e) => handleRoleChange(e.target.value)}
                            onBlur={() => {}}
                            options={roles.map(r => ({ value: r._id, label: r.displayName || r.name }))}
                            error={editRoleModal.error}
                        />
                    </div>
                  </div>
                )}

                {/* Modules Tab */}
                {editRoleModal.activeTab === "modules" && (
                  <div>
                    <p style={{ marginBottom: "0.5rem", fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}>
                      Effective modules: {editRoleModal.selectedModules.length > 0 ? editRoleModal.selectedModules.join(", ") : "None"}
                    </p>
                    <MultiSelect
                      label="Assigned Modules"
                      name="selectedModules"
                      value={editRoleModal.selectedModules}
                      onChange={(e) => {
                        setEditRoleModal(prev => ({ ...prev, selectedModules: e.target.value }));
                      }}
                      options={MAIN_MODULES.map(m => ({ value: m.key, label: m.label }))}
                      error={editRoleModal.error}
                    />
                  </div>
                )}

                {/* Other Rights Tab */}
                {editRoleModal.activeTab === "otherRights" && (
                  <div>
                    {/* Permission Toolbar - Same as Setup Page */}
                    <div className="permission-toolbar">
                      <div className="permission-toolbar__selector">
                        <label htmlFor="user-permission-module-select">Select Module</label>
                        <select
                          id="user-permission-module-select"
                          value={editRoleModal.selectedModuleKey}
                          onChange={(e) => handleModuleFilter(e.target.value)}
                        >
                          {moduleOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="permission-toolbar__selector">
                        <label htmlFor="user-permission-category-select">View Category</label>
                        <select
                          id="user-permission-category-select"
                          value={editRoleModal.selectedCategoryKey}
                          onChange={(e) => handleCategoryFilter(e.target.value)}
                        >
                          {categoryOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="permission-toolbar__search">
                        <label htmlFor="user-permission-search-input">Search rights</label>
                        <input
                          id="user-permission-search-input"
                          type="text"
                          placeholder="Search modules, pages, or actions..."
                          value={editRoleModal.searchTerm}
                          onChange={(e) => handlePermissionSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Permissions Tree */}
                    <div className="permission-tree-container">
                      <div className="tree-root">
                        {finalFilteredModules.length === 0 && (
                          <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
                            No matching rights found.
                          </div>
                        )}

                        {finalFilteredModules.map((module) => (
                          <div key={module.key} className="tree-module">
                            {/* Module Header */}
                            <div
                              className="module-header"
                              onClick={(e) => {
                                if (e.target.type !== 'checkbox') {
                                  toggleModuleExpand(module.key);
                                }
                              }}
                            >
                              <span className={`expand-icon ${editRoleModal.expandedModules[module.key] ? 'expanded' : ''}`}>▶</span>
                              {module.accessKey && (
                                <input
                                  type="checkbox"
                                  checked={editRoleModal.assignedPermissions.includes(module.accessKey)}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    const newPermissions = isChecked
                                      ? [...editRoleModal.assignedPermissions, module.accessKey]
                                      : editRoleModal.assignedPermissions.filter(p => p !== module.accessKey);
                                    setEditRoleModal(prev => ({ ...prev, assignedPermissions: newPermissions }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  title="Enable/Disable entire module"
                                />
                              )}
                              <span>{module.label}</span>
                            </div>

                            {/* Submodules (Pages) */}
                            {editRoleModal.expandedModules[module.key] && (
                              <div className="tree-pages">
                                {module.pages.map(page => (
                                  <div key={page.key} className="tree-page">
                                    {/* Page Header */}
                                    <div className="page-header">
                                      <input
                                        type="checkbox"
                                        checked={page.actions.every(action => {
                                          const permissionKey = `${module.key}:${page.key}:${action.key}`;
                                          return editRoleModal.assignedPermissions.includes(permissionKey);
                                        })}
                                        onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          const newPermissions = [...editRoleModal.assignedPermissions];

                                          page.actions.forEach(action => {
                                            const permissionKey = `${module.key}:${page.key}:${action.key}`;
                                            if (isChecked) {
                                              if (!newPermissions.includes(permissionKey)) {
                                                newPermissions.push(permissionKey);
                                              }
                                            } else {
                                              const index = newPermissions.indexOf(permissionKey);
                                              if (index > -1) {
                                                newPermissions.splice(index, 1);
                                              }
                                            }
                                          });

                                          setEditRoleModal(prev => ({ ...prev, assignedPermissions: newPermissions }));
                                        }}
                                        title="Select all actions in this page"
                                      />
                                      <span>{page.label}</span>
                                    </div>

                                    {/* Page Actions */}
                                    <div className="page-actions">
                                      {page.actions.map(action => {
                                        const permissionKey = `${module.key}:${page.key}:${action.key}`;
                                        const isChecked = editRoleModal.assignedPermissions.includes(permissionKey);
                                        return (
                                          <label key={action.key} className="action-item">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => togglePermission(permissionKey)}
                                            />
                                            <span>{action.label}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "10px" }}>
                    <Button variant="secondary" onClick={() => setEditRoleModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                    <Button onClick={handleSubmitEditRole} disabled={editRoleModal.isSubmitting}>
                        {editRoleModal.isSubmitting ? "Saving..." : "Save"}
                    </Button>
                </div>

                {editRoleModal.error && (
                  <div style={{ color: "red", marginTop: "0.5rem", fontSize: "0.875rem" }}>
                    {editRoleModal.error}
                  </div>
                )}
             </div>
          </Modal>
        )}

        {/* Assign Reporting Modal */}
        {assignReportingModal.isOpen && (
          <Modal
            isOpen={assignReportingModal.isOpen}
            onClose={() => setAssignReportingModal(prev => ({ ...prev, isOpen: false }))}
            title="Assign Reporting Manager"
            footer={<></>}
            className="user-page-modal"
          >
             <div style={{ padding: "1rem", width: "100%", maxWidth: "100%" }}>
                <p style={{ marginBottom: "0.5rem" }}>User: <strong>{assignReportingModal.userName}</strong></p>
                <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "1rem" }}>Assign a manager who this user reports to.</p>
                <div style={{ marginBottom: "1.5rem" }}>
                    <Select
                        label="Select Manager"
                        name="newManagerId"
                        value={assignReportingModal.newManagerId}
                        onChange={(e) => setAssignReportingModal(prev => ({ ...prev, newManagerId: e.target.value, error: "" }))}
                        onBlur={() => {}}
                        options={[
                            { value: "", label: "No Manager (Remove Reporting)" },
                            ...potentialManagers
                                .filter(m => m._id !== assignReportingModal.userId)
                                .map(m => ({ value: m._id, label: `${m.name} (${m.userId})` }))
                        ]}
                        error={assignReportingModal.error}
                    />
                </div>
             </div>
              <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "10px" }}>
                  <Button variant="secondary" onClick={() => setAssignReportingModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                  <Button onClick={handleSubmitAssignReporting} disabled={assignReportingModal.isSubmitting}>
                      {assignReportingModal.isSubmitting ? "Saving..." : "Save"}
                  </Button>
              </div>
          </Modal>
        )}

        {/* Status Change Modal */}
        <StatusChangeModal
          isOpen={statusChangeModal.isOpen}
          entityType={statusChangeModal.entityType}
          entityName={statusChangeModal.entityName}
          newStatus={statusChangeModal.newStatus}
          onConfirm={handleStatusChangeConfirm}
          onCancel={handleStatusChangeCancel}
        />
      </div>
    </div>
  );
};

export default Users;
