import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchUserById } from "../../../services/userApi";
import { PageLoader } from "../../../components/Loader/Loader.jsx";
import { SetPageTitle } from "../../../components/SetPageTitle/SetPageTitle.jsx";
import PageSidebar from "../../../components/PageSidebar/PageSidebar";
import "./UserDetails.css";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");

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

  const menuItems = [
    { key: "basic", label: "Basic Information" },
    { key: "items", label: "Assigned Items" },
    { key: "timeline", label: "User Timeline" },
    { key: "audit", label: "Audit & Login" },
  ];

  const sidebarHeader = (
    <div className="ud-sidebar-top">
      <div className="ud-sidebar-avatar">{getInitials(user?.name || "User")}</div>
      <div>
        <h2>{user?.name || "User"}</h2>
        <p><span>ID : </span> {user?.userId || "--"} | {user?.role || "User"}</p>
      </div>
    </div>
  );

  const sidebarFooter = (
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
  );

  return (
    <>
      <SetPageTitle title={user ? `${user.name} | User Details` : "User Details"} />
      <div className="user-details-view">
        <PageSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          menuItems={menuItems}
          header={sidebarHeader}
          footer={sidebarFooter}
          title="User Details"
          initials={getInitials(user?.name)}
          storageKey="user-details-hamburger-pos"
          idPrefix="ud"
        />

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
          <div className={`ud-section ${activeTab === "basic" ? "active" : ""}`}>
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
          <div className={`ud-section ${activeTab === "items" ? "active" : ""}`}>
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
          <div className={`ud-section ${activeTab === "timeline" ? "active" : ""}`}>
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
          <div className={`ud-section ${activeTab === "audit" ? "active" : ""}`}>
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
