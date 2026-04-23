/**
 * Page: Setup
 * Description: Organization, Roles & Rights, aur Branches configuration manage karta hai (permissions ke hisaab se tabs visible).
 * Major Logics:
 * - Allowed tabs ko user permissions ke basis par filter karna
 * - Toast notifications dikhana aur auto-hide
 */
import { useState, useEffect, useMemo } from "react";
import { Alert } from "../../components";
import RoleRightsTab from "./components/RoleRightsTab";
import BranchesTab from "./components/BranchesTab";
import OrganizationTab from "./components/OrganizationTab";
import { isSuperAdmin, canAccessPage } from "../../utils/permissionHelper";
import { SetPageTitle } from "../../components/SetPageTitle";
import PageSidebar from "../../components/PageSidebar/PageSidebar";
import "./Setup.css";

const Setup = () => {
  const [activeTab, setActiveTab] = useState("organization");
  const [toast, setToast] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!toast.message) return;
    const timeout = setTimeout(() => setToast({ type: "", message: "" }), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const allTabs = useMemo(
    () => [
      { 
        key: "organization", 
        label: "Organization", 
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
        ),
        description: "Configure organization details and security policies."
      },
      { 
        key: "branches", 
        label: "Branches", 
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        ),
        description: "Manage organization branches and locations."
      },
      { 
        key: "roles", 
        label: "Roles & Rights", 
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        ),
        description: "Define user roles and module permissions."
      },
    ],
    []
  );

  const allowedTabs = useMemo(() => {
    return allTabs.filter(
      (t) => isSuperAdmin() || canAccessPage("setup", t.key)
    );
  }, [allTabs]);

  const effectiveActiveTab = useMemo(() => {
    if (allowedTabs.length === 0) return "";
    if (allowedTabs.some((t) => t.key === activeTab)) return activeTab;
    return allowedTabs[0].key;
  }, [allowedTabs, activeTab]);

  const activeTabData = useMemo(() => {
    return allowedTabs.find((t) => t.key === effectiveActiveTab);
  }, [allowedTabs, effectiveActiveTab]);

  const pageTitle = `${(activeTabData?.label || "").toUpperCase()} | ${import.meta.env.VITE_APP_NAME || "ABCD"}`;

  if (allowedTabs.length === 0) {
    return (
      <div className="setup-page" style={{ padding: '2rem', justifyContent: 'center', alignItems: 'center' }}>
        <Alert
          type="danger"
          title="Access Denied"
          onClose={() => {}}
        >
          You do not have permission to access Setup.
        </Alert>
      </div>
    );
  }
  
  return (
    <>
      <SetPageTitle title={pageTitle} /> 
      <div className="setup-page">
        <PageSidebar
          activeTab={effectiveActiveTab}
          onTabChange={setActiveTab}
          menuItems={allowedTabs}
          header={
            <div className="setup-sidebar-header">
              <h1>Setup</h1>
              <p>Configure and manage your organization settings.</p>
            </div>
          }
          title="Setup"
          initials="S"
          storageKey="setup-hamburger-pos"
          idPrefix="setup"
        />

        <main className="setup-main">
          {toast.message && (
            <div className="setup-toast">
              <Alert
                type={toast.type === "danger" ? "danger" : "success"}
                title={toast.type === "danger" ? "Error" : "Success"}
                onClose={() => setToast({ type: "", message: "" })}
              >
                {toast.message}
              </Alert>
            </div>
          )}
          
          <header className="setup-content-header">
            <h2>{activeTabData?.label}</h2>
            <p>{activeTabData?.description}</p>
          </header>

          <div className="setup-content setup-content-card">
            {effectiveActiveTab === "organization" && (
              <OrganizationTab setToast={setToast} />
            )}

            {effectiveActiveTab === "branches" && (
              // @ts-ignore
              <BranchesTab toast={toast} setToast={setToast} />
            )}
        
            {effectiveActiveTab === "roles" && (
              // @ts-ignore
              <RoleRightsTab toast={toast} setToast={setToast} />
            )}
          </div>
         
        </main>
      </div>
    </>
  );
};

export default Setup;
