/**
 * Page: Setup
 * Description: Organization, Roles & Rights, aur Branches configuration manage karta hai (permissions ke hisaab se tabs visible).
 * Major Logics:
 * - Allowed tabs ko user permissions ke basis par filter karna
 * - Toast notifications dikhana aur auto-hide
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { Alert } from "../../components";
import RoleRightsTab from "./components/RoleRightsTab";
import BranchesTab from "./components/BranchesTab";
import OrganizationTab from "./components/OrganizationTab";
import { isSuperAdmin, canAccessPage } from "../../utils/permissionHelper";
import { SetPageTitle } from "../../components/SetPageTitle";
import "./Setup.css";

const Setup = () => {
  const [activeTab, setActiveTab] = useState("organization");
  const [toast, setToast] = useState({ type: "", message: "" });
  const [setupSidebarOpen, setSetupSidebarOpen] = useState(false);
  const [btnPosition, setBtnPosition] = useState({ x: 18, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [wasDragged, setWasDragged] = useState(false);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPos = localStorage.getItem("setup-hamburger-pos");
    if (savedPos) {
      try {
        setBtnPosition(JSON.parse(savedPos));
      } catch (e) {
        console.error("Failed to parse saved position", e);
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setBtnPosition(prev => {
        const padding = 10;
        const btnSize = 48;
        const newX = Math.max(padding, Math.min(window.innerWidth - btnSize - padding, prev.x));
        const newY = Math.max(padding, Math.min(window.innerHeight - btnSize - padding, prev.y));
        return { x: newX, y: newY };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Draggable Handlers
  const handleDragStart = (e) => {
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = {
      x: clientX - btnPosition.x,
      y: clientY - btnPosition.y
    };
    
    setIsDragging(true);
    setWasDragged(false);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

    let newX = clientX - dragStartPos.current.x;
    let newY = clientY - dragStartPos.current.y;

    const padding = 10;
    const btnSize = 48;
    newX = Math.max(padding, Math.min(window.innerWidth - btnSize - padding, newX));
    newY = Math.max(padding, Math.min(window.innerHeight - btnSize - padding, newY));

    if (Math.abs(newX - btnPosition.x) > 5 || Math.abs(newY - btnPosition.y) > 5) {
      setWasDragged(true);
    }

    setBtnPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem("setup-hamburger-pos", JSON.stringify(btnPosition));
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove, { passive: false });
      window.addEventListener("touchend", handleDragEnd);
    } else {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, btnPosition]);

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
        {/* Mobile Toggle Button */}
        <div 
          className={`setup-sidebar-toggle ${setupSidebarOpen ? 'hidden' : ''}`}
          style={{ 
            left: `${btnPosition.x}px`, 
            top: `${btnPosition.y}px`,
            position: 'fixed',
            zIndex: 10,
            touchAction: 'none'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <button 
            className={`setup-hamburger-btn ${isDragging ? 'dragging' : ''}`}
            onClick={() => {
              if (!wasDragged) {
                setSetupSidebarOpen(true);
              }
            }}
            aria-label="Open setup sidebar"
            title="Open setup sidebar"
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            <span>S</span>
          </button>
        </div>

        {/* Mobile Overlay */}
        {setupSidebarOpen && (
          <div 
            className="setup-sidebar-overlay"
            onClick={() => setSetupSidebarOpen(false)}
          ></div>
        )}

        <aside className={`setup-sidebar ${setupSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="setup-sidebar-header">
            {/* Mobile Close Button */}
            <button 
              className="setup-sidebar-close-btn"
              onClick={() => setSetupSidebarOpen(false)}
              aria-label="Close setup sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h1>Setup</h1>
            <p>Configure and manage your organization settings.</p>
          </div>

          <nav className="setup-nav">
            {allowedTabs.map((t) => (
              <button
                key={t.key}
                className={`setup-nav-item ${effectiveActiveTab === t.key ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(t.key);
                  setSetupSidebarOpen(false);
                }}
              >
                <span className="setup-nav-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

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
          
          <section className="setup-content-header">
            <h2>{activeTabData?.label}</h2>
            <p>{activeTabData?.description}</p>
        </section>

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
