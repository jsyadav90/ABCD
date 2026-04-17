/**
 * Dashboard Module 2
 * Description: Minimal dashboard for Module 2 with profile card for easy module switching.
 * Future: This will be expanded with Module 2 specific features and design.
 */
import React from "react";
import ProfileCard from "../../layouts/ProfileCard";
import { useAuth } from "../../hooks/useAuth";
import { getSelectedBranch, setSelectedBranch } from "../../utils/scope";
import { getSelectedAppModule, setSelectedAppModule, MODULES } from "../../utils/appModule";
import { authAPI } from "../../services/api";
import { fetchBranchesForDropdown } from "../../services/userApi";
import "./Dashboard.css";

const DashboardModule2 = () => {
  const { user } = useAuth();

  const [branch, setBranch] = React.useState("");
  const [selectedAppModule, setSelectedAppModuleLocal] = React.useState(getSelectedAppModule());

  const [profile, setProfile] = React.useState({
    name: "",
    email: "",
    role: "",
    userId: "",
    organizationId: null,
    branchIds: [],
  });

  const [branchOptions, setBranchOptions] = React.useState([]);
  const [appModuleOptions, setAppModuleOptions] = React.useState([]);

  // Initialize profile and branches (same as main dashboard)
  React.useEffect(() => {
    let isMounted = true;
    const normalizeModuleId = (moduleId) => {
      if (!moduleId) return moduleId;
      return String(moduleId).replace(/^module([12])$/, 'module_$1');
    };

    const init = async () => {
      try {
        const resp = await authAPI.getProfile();
        const data = resp.data?.data || {};
        const u = data.user || {};

        if (!isMounted) return;

        let rawModules = Array.isArray(u.modules) ? u.modules : [];
        const normalizedModules = rawModules.map(normalizeModuleId);

        const userInfo = {
          name: u.name || "",
          email: u.email || "",
          role: u.role || "",
          userId: u.userId || "",
          organizationId: u.organizationId || null,
          branchIds: Array.isArray(u.branchId) ? u.branchId.map(b => String(b._id || b)) : [],
          modules: normalizedModules,
        };

        setProfile(userInfo);

        // Filter app modules based on user's assigned modules
        let availableAppModules = [];
        
        if (userInfo.modules && userInfo.modules.length > 0) {
          availableAppModules = MODULES
            .filter(m => userInfo.modules.includes(m.id))
            .map(m => ({ value: m.id, label: m.label }));
        }
        
        setAppModuleOptions(availableAppModules);

        // Set default selected app module based on available modules
        const savedAppModule = getSelectedAppModule();
        let selectedAppModuleValue = savedAppModule;

        if (availableAppModules.length === 1) {
          selectedAppModuleValue = availableAppModules[0].value;
        } else if (!availableAppModules.some(m => m.value === savedAppModule)) {
          selectedAppModuleValue = availableAppModules[0]?.value || "";
        }

        setSelectedAppModuleLocal(selectedAppModuleValue);
        setSelectedAppModule(selectedAppModuleValue);

        // Fetch branches for the organization - THIS IS THE KEY FIX!
        const branches = await fetchBranchesForDropdown(userInfo.organizationId);
        if (!isMounted) return;

        const allOpts = branches.map(b => ({ value: String(b._id), label: b.name }));

        // Filter branches based on user's assigned branches
        let availableOpts = allOpts;
        if (userInfo.branchIds.length > 0) {
          availableOpts = allOpts.filter(o => userInfo.branchIds.includes(o.value));
        }

        setBranchOptions(availableOpts);

        // Set default branch
        const savedBranch = getSelectedBranch();
        let selectedBranchValue = "";

        const isSavedAllAllowed = savedBranch === "__ALL__" && availableOpts.length > 1;
        const isSavedBranchValid = availableOpts.some(o => o.value === savedBranch);

        if (savedBranch && (isSavedAllAllowed || isSavedBranchValid)) {
          selectedBranchValue = savedBranch;
        } else {
          selectedBranchValue = availableOpts.length > 1 ? "__ALL__" : (availableOpts[0]?.value || "");
        }

        setBranch(selectedBranchValue);

        const selectedOpt = availableOpts.find(o => o.value === selectedBranchValue);
        setSelectedBranch(selectedBranchValue, selectedOpt?.label || "");
      } catch (error) {
        console.error("Error initializing Module 2 dashboard:", error);
      }
    };

    init();
    return () => { isMounted = false; };
  }, []);

  const applyFilters = async () => {
    try {
      // Save the selected app module - the reactive DashboardRouter will handle the UI update
      if (selectedAppModule) {
        setSelectedAppModule(selectedAppModule);
      }

      // Save the selected branch
      if (branch) {
        const selectedOpt = branchOptions.find(o => o.value === branch);
        setSelectedBranch(branch, selectedOpt?.label || "");
      }

      // No need for manual navigation - the DashboardRouter listens for appModuleChanged events
      // and will automatically switch dashboards
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  };

  const moduleInfo = MODULES.find((item) => item.id === "module_2");

  return (
    <div className="dashboard dashboard-module-2">
      

      {/* Profile Card for easy module switching */}
      <ProfileCard
        profile={profile}
        branch={branch}
        setBranch={setBranch}
        branchOptions={branchOptions}
        selectedAppModule={selectedAppModule}
        setSelectedAppModule={setSelectedAppModuleLocal}
        appModuleOptions={appModuleOptions}
        onApplyFilters={applyFilters}
      />


      <div className="dash-header">
        <h1>{moduleInfo?.label || "Endpoint Management"} Dashboard</h1>
        <p>Coming soon - New features and capabilities</p>
      </div>

    </div>
  );
};

export default DashboardModule2;