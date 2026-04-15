/**
 * Dashboard Module 2
 * Description: Minimal dashboard for Module 2 with profile card for easy module switching.
 * Future: This will be expanded with Module 2 specific features and design.
 */
import React from "react";
import ProfileCard from "../../layouts/ProfileCard";
import { useAuth } from "../../hooks/useAuth";
import { getSelectedBranch, setSelectedBranch } from "../../utils/scope";
import { getSelectedAppModule, setSelectedAppModule } from "../../utils/appModule";
import { authAPI } from "../../services/api";
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
  const [appModuleOptions, setAppModuleOptions] = React.useState([
    { value: "module_1", label: "Module 1" },
    { value: "module_2", label: "Module 2" },
  ]);

  // Initialize profile and branches (same as main dashboard)
  React.useEffect(() => {
    const init = async () => {
      try {
        const resp = await authAPI.getProfile();
        const data = resp.data?.data || {};
        const u = data.user || {};

        const userInfo = {
          name: u.name || "",
          email: u.email || "",
          role: u.role || "",
          userId: u.userId || "",
          organizationId: u.organizationId || null,
          branchIds: Array.isArray(u.branchId) ? u.branchId.map(b => String(b)) : [],
        };

        setProfile(userInfo);

        // For Module 2, we might not need branch filtering initially
        // But keeping the structure for future expansion
        setBranchOptions([]);
      } catch (error) {
        console.error("Error initializing Module 2 dashboard:", error);
      }
    };

    init();
  }, []);

  const applyFilters = async () => {
    try {
      // Save the selected app module - the reactive DashboardRouter will handle the UI update
      setSelectedAppModule(selectedAppModule);

      // No need for manual navigation - the DashboardRouter listens for appModuleChanged events
      // and will automatically switch dashboards
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  };

  return (
    <div className="dashboard dashboard-module-2">
      <div className="dash-header">
        <h1>Module 2 Dashboard</h1>
        <p>Coming soon - New features and capabilities</p>
      </div>

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

      {/* Placeholder content for future Module 2 features */}
      <div className="module-2-placeholder">
        <div className="placeholder-card">
          <h3>🚀 Module 2 Features</h3>
          <p>New capabilities are being developed. Check back soon!</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardModule2;