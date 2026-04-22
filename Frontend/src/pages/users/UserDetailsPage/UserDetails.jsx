import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchUserById } from "../../../services/userApi";
import { PageLoader } from "../../../components/Loader/Loader.jsx";
import { SetPageTitle } from "../../../components/SetPageTitle/SetPageTitle.jsx";
import "./UserDetails.css";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("basic");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [btnPosition, setBtnPosition] = useState({ x: 18, y: 65 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [wasDragged, setWasDragged] = useState(false);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPos = localStorage.getItem("user-details-hamburger-pos");
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
      setBtnPosition((prev) => {
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
      y: clientY - btnPosition.y,
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

    // Boundary checks
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
      localStorage.setItem("user-details-hamburger-pos", JSON.stringify(btnPosition));
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
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchUserById(id);
        setUser({
          ...data,
          _id: data._id || data.id,
          status: data.isActive ? "Active" : "Inactive",
        });
      } catch (err) {
        setError(err.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadUser();
  }, [id]);

  if (loading && !user) return <PageLoader message="Loading user..." />;

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const mockAssignedItems = [
    {
      assetType: "Laptop",
      assetCode: "LT-DEL-221",
      assignedDate: "12-Mar-2024",
      status: "Active",
    },
    {
      assetType: "Monitor",
      assetCode: "MN-DEL-089",
      assignedDate: "12-Mar-2024",
      status: "Active",
    },
    {
      assetType: "Keyboard",
      assetCode: "KB-DEL-045",
      assignedDate: "15-Mar-2024",
      status: "Active",
    },
  ];

  const mockTimeline = [
    { date: "15-Jan-2022", event: "User Created" },
    { date: "10-Mar-2023", event: "Promoted to Admin" },
    { date: "02-Jul-2024", event: "Password Reset" },
    { date: "18-Feb-2026", event: "Profile Updated" },
  ];

  const mockAuditLog = [
    {
      date: "18-Feb-2026",
      ip: "103.45.21.9",
      device: "Chrome / Windows",
      status: "Success",
      statusClass: "success",
    },
    {
      date: "15-Feb-2026",
      ip: "192.168.1.5",
      device: "Unknown",
      status: "Failed",
      statusClass: "fail",
    },
    {
      date: "12-Feb-2026",
      ip: "103.45.21.9",
      device: "Safari / macOS",
      status: "Success",
      statusClass: "success",
    },
  ];

  return (
    <>
      <SetPageTitle title={user ? `${user.name} | User Details` : "User Details"} />
      <div className="user-details-view" onClick={(e) => {
        if (sidebarOpen && e.target === e.currentTarget) {
          setSidebarOpen(false);
        }
      }}>
        {/* Mobile Toggle Button */}
        <div 
          className={`ud-sidebar-toggle ${sidebarOpen ? 'hidden' : ''}`}
          style={{ 
            left: `${btnPosition.x}px`, 
            top: `${btnPosition.y}px`,
            position: 'fixed',
            zIndex: 1000,
            touchAction: 'none'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <button 
            className={`ud-hamburger-btn ${isDragging ? 'dragging' : ''}`}
            onClick={() => {
              if (!wasDragged) {
                setSidebarOpen(true);
              }
            }}
            aria-label="Open sidebar"
            title="Open sidebar"
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            {user?.name && <span>{getInitials(user.name)}</span>}
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="ud-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside className={`ud-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="ud-sidebar-panel">
            {/* Close button - visible when sidebar is open */}
            <button 
              className="ud-sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="ud-sidebar-top">
              <div className="ud-sidebar-avatar">{getInitials(user?.name || "User")}</div>
              <div>
                <h2>{user?.name || "User"}</h2>
                <p><span>ID : </span> {user?.userId || "--"} | {user?.role || "User"}</p>
              </div>
            </div>

            <div className="ud-menu">
              <button
                className={`ud-menu-item ${activeSection === "basic" ? "active" : ""}`}
                onClick={() => {
                  setActiveSection("basic");
                  setSidebarOpen(false);
                }}
              >
                Basic Information
              </button>
              <button
                className={`ud-menu-item ${activeSection === "items" ? "active" : ""}`}
                onClick={() => {
                  setActiveSection("items");
                  setSidebarOpen(false);
                }}
              >
                Assigned Items
              </button>
              <button
                className={`ud-menu-item ${activeSection === "timeline" ? "active" : ""}`}
                onClick={() => {
                  setActiveSection("timeline");
                  setSidebarOpen(false);
                }}
              >
                User Timeline
              </button>
              <button
                className={`ud-menu-item ${activeSection === "audit" ? "active" : ""}`}
                onClick={() => {
                  setActiveSection("audit");
                  setSidebarOpen(false);
                }}
              >
                Audit & Login
              </button>
            </div>

            <div className="ud-quick-stats">
              <div className="ud-card-title">Quick Stats</div>
              <div className="ud-stats-grid">
                <div className="ud-stat-card">
                  <span>Items</span>
                  <strong>{mockAssignedItems.length}</strong>
                </div>
                <div className="ud-stat-card">
                  <span>Logs</span>
                  <strong>{mockAuditLog.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ud-main">
          {error && (
            <div className="error-banner">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Profile Header Card like UnifiedUserProfile */}
          <section className="ud-card ud-header-card">
            <div className="ud-header-content">
              <div>
                <p className="ud-header-label">User Details</p>
                <h2>Manage and view user information, assets and activities</h2>
              </div>
              <div className="ud-header-actions">
                <button className="ud-btn ud-btn-primary" onClick={() => navigate(-1)}>Go Back</button>
              </div>
            </div>
          </section>

          {/* Basic Information */}
          <div className={`ud-section ${activeSection === "basic" ? "active" : ""}`}>
            <div className="ud-card">
              <div className="ud-card-title">Basic Information</div>
              <div className="ud-info-grid">
                <div className="ud-info-row"><span>Name</span><strong>{user?.name || "--"}</strong></div>
                <div className="ud-info-row"><span>Gender</span><strong>{user?.gender || "--"}</strong></div>
                <div className="ud-info-row"><span>Email</span><strong>{user?.email || "--"}</strong></div>
                <div className="ud-info-row"><span>Mobile</span><strong>{user?.phone_no || "--"}</strong></div>
                <div className="ud-info-row"><span>Department</span><strong>{user?.department || "--"}</strong></div>
                <div className="ud-info-row"><span>Designation</span><strong>{user?.designation || "--"}</strong></div>
                <div className="ud-info-row"><span>Role</span><strong>{user?.role || "--"}</strong></div>
                <div className="ud-info-row"><span>Can Login</span><strong>{user?.canLogin ? "Yes" : "No"}</strong></div>
                <div className="ud-info-row"><span>Status</span><strong className={`status-badge ${user?.isActive ? 'status-active' : 'status-inactive'}`}>{user?.status || "--"}</strong></div>
              </div>
            </div>
          </div>

          {/* Assigned Items */}
          <div className={`ud-section ${activeSection === "items" ? "active" : ""}`}>
            <div className="ud-card">
              <div className="ud-card-title">Assigned Items</div>
              <div className="ud-table-wrap">
                <table className="ud-table">
                  <thead>
                    <tr>
                      <th>Item Type</th>
                      <th>Asset Code</th>
                      <th>Assigned Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAssignedItems.map((item, idx) => (
                      <tr key={idx}>
                        <td data-label="Item Type">{item.assetType}</td>
                        <td data-label="Asset Code">{item.assetCode}</td>
                        <td data-label="Assigned Date">{item.assignedDate}</td>
                        <td data-label="Status"><span className="status-pill status-active">{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Timeline */}
          <div className={`ud-section ${activeSection === "timeline" ? "active" : ""}`}>
            <div className="ud-card">
              <div className="ud-card-title">User Timeline</div>
              <ul className="ud-timeline-list">
                {mockTimeline.map((item, idx) => (
                  <li key={idx}>
                    <div className="ud-timeline-item">
                      <span className="ud-timeline-date">{item.date}</span>
                      <span className="ud-timeline-event">{item.event}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Audit & Login */}
          <div className={`ud-section ${activeSection === "audit" ? "active" : ""}`}>
            <div className="ud-card">
              <div className="ud-card-title">Audit & Login History</div>
              <div className="ud-table-wrap">
                <table className="ud-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>IP</th>
                      <th>Device</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAuditLog.map((log, idx) => (
                      <tr key={idx}>
                        <td data-label="Date">{log.date}</td>
                        <td data-label="IP">{log.ip}</td>
                        <td data-label="Device">{log.device}</td>
                        <td data-label="Status">
                          <span className={`status-pill status-${log.statusClass}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UserDetails;
