import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { fetchUserById } from "../../../services/userApi";
import { SetPageTitle } from "../../../components/SetPageTitle/SetPageTitle";
import { PageLoader } from "../../../components/Loader/Loader";
import "./UnifiedUserProfilePage.css";

const UnifiedUserProfilePage = () => {
  const navigate = useNavigate();
  const { id: routeUserId } = useParams();
  const authContext = /** @type {{ user?: any; loading: boolean }} */ (useAuth());
  const { user: authUser, loading: authLoading } = authContext;

  const [user, setUser] = useState(/** @type {any} */ (null));
  const [assignedAssets, setAssignedAssets] = useState(/** @type {any[]} */ ([]));
  const [loginSessions, setLoginSessions] = useState(/** @type {any[]} */ ([]));
  const [recentActivity, setRecentActivity] = useState(/** @type {string[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);
  const isOwnProfile = !routeUserId;

  // When auth finishes loading and we have authUser, set it immediately
  useEffect(() => {
    if (!authLoading) {
      const authUserId = authUser?._id || authUser?.id;
      if (authUser && authUserId) {
        setUser(authUser);
        setAssignedAssets([]);
        setLoginSessions([]);
        setRecentActivity([]);
        setLoading(false);
        setError(null);
      } else {
        setLoading(false);
        setError("User session expired. Please log in again.");
      }
    }
  }, [authLoading, authUser]);

  // Fetch additional user profile data and assets
  useEffect(() => {
    let mounted = true;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let timeout = null;

    const fetchAdditionalData = async () => {
      try {
        if (authLoading) {
          timeout = setTimeout(fetchAdditionalData, 500);
          return;
        }

        const userIdToFetch = routeUserId || authUser?._id || authUser?.id;
        if (!userIdToFetch) {
          return;
        }

        try {
          const apiData = await fetchUserById(userIdToFetch);
          if (mounted && apiData) {
            setUser((/** @type {any} */ prev) => ({
              ...((prev || {})),
              ...apiData,
              _id: apiData._id || apiData.id || prev?._id,
              status: apiData.isActive !== undefined
                ? (apiData.isActive ? "Active" : "Inactive")
                : prev?.status,
            }));
          }
        } catch (fetchErr) {
          const err = /** @type {any} */ (fetchErr);
          console.warn("[Profile] Could not fetch from API:", err.message || err);
        }

        if (mounted) {
          setAssignedAssets([
            {
              _id: "1",
              assetCode: "DEL-LT-001",
              assetName: "Dell Latitude",
              assetType: "Laptop",
              status: "Assigned",
            },
            {
              _id: "2",
              assetCode: "HP-PR-005",
              assetName: "HP Printer",
              assetType: "Printer",
              status: "Repair Pending",
            },
            {
              _id: "3",
              assetCode: "LEN-MB-002",
              assetName: "Lenovo Monitor",
              assetType: "Monitor",
              status: "Assigned",
            },
          ]);

          setLoginSessions([
            {
              device: "Chrome",
              location: "Gurgaon",
              lastActive: "Active Now",
              timestamp: new Date(),
            },
            {
              device: "Firefox",
              location: "Delhi",
              lastActive: "Yesterday",
              timestamp: new Date(Date.now() - 86400000),
            },
          ]);

          setRecentActivity([
            "Updated asset #A1023",
            "Requested software installation",
            "Approved upgrade request",
            "Logged in from Chrome - Gurgaon",
          ]);
        }
      } catch (err) {
        const errorObj = /** @type {any} */ (err);
        if (mounted) {
          setError(errorObj.message || "Error loading profile");
        }
      }
    };

    const authUserId = authUser?._id || authUser?.id;
    if (authUserId && !authLoading) {
      fetchAdditionalData();
    }

    return () => {
      mounted = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [authUser, routeUserId, authLoading]);

  if (loading) return <PageLoader message="Loading profile..." />;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-700 mb-4">{error || "Please log in to view your profile"}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const getInitials = /** @param {string | undefined} name */ (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = /** @param {string | undefined} status */ (status) => {
    switch (status?.toLowerCase()) {
      case "assigned":
        return "text-green-600 bg-green-50";
      case "repair pending":
        return "text-yellow-600 bg-yellow-50";
      case "inactive":
        return "text-red-600 bg-red-50";
      case "active":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const notificationItems = [
    "2 pending approvals require action",
    "Asset warranty expiring in 3 days",
    "New branch assigned to your account",
  ];

  const securityInfo = {
    twoFactor: "Enabled",
    recentLogin: loginSessions[0]?.device ? `${loginSessions[0].device} - ${loginSessions[0].location}` : "Unknown",
    passwordStatus: "Needs Update",
  };

  return (
    <>
      <SetPageTitle title={`${user.name} - User Profile`} />
      <div className="unified-profile-page" onClick={(e) => {
        // Close sidebar if clicking outside on mobile
        if (profileSidebarOpen && e.target === e.currentTarget) {
          setProfileSidebarOpen(false);
        }
      }}>
        {/* Toggle Button - Shows user initials to open sidebar (only visible on mobile) */}
        <div className={`profile-sidebar-toggle ${profileSidebarOpen ? 'hidden' : ''}`}>
          <button 
            className="profile-hamburger-btn"
            onClick={() => setProfileSidebarOpen(true)}
            aria-label="Open profile sidebar"
            title="Open profile sidebar"
          >
            {user.name && <span>{getInitials(user.name)}</span>}
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {profileSidebarOpen && (
          <div 
            className="profile-sidebar-overlay"
            onClick={() => setProfileSidebarOpen(false)}
          ></div>
        )}

        <aside className={`profile-sidebar ${profileSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="profile-card profile-sidebar-panel">
            {/* Close button - visible when sidebar is open */}
            <button 
              className="profile-sidebar-close-btn"
              onClick={() => setProfileSidebarOpen(false)}
              aria-label="Close profile sidebar"
              title="Close profile sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="sidebar-top">
              <div className="sidebar-avatar">{getInitials(user.name)}</div>
              <div>
              <h2>{user.name}</h2>
              <p><span>ID : </span> {user.roleId?.name || user.role || "NA"}</p>
              </div>
              {/* <span className="status-badge status-active">Active</span> */}
            </div>

            <div className="sidebar-actions">
              <button className="sidebar-btn sidebar-btn-primary">Edit Profile</button>
              <button className="sidebar-btn sidebar-btn-outline">Change Password</button>
              <button className="sidebar-btn sidebar-btn-outline">Notification Settings</button>
              <button className="sidebar-btn sidebar-btn-danger">Logout All Devices</button>
            </div>

            <div className="permission-block quick-stats-block">
              <div className="card-title">Quick Stats</div>
              <div className="quick-stats-grid">
                <div className="quick-stat-card">
                  <span>Assets</span>
                  <strong>{assignedAssets.length}</strong>
                </div>
                <div className="quick-stat-card">
                  <span>Tickets</span>
                  <strong>3</strong>
                </div>
                <div className="quick-stat-card">
                  <span>Approvals</span>
                  <strong>2</strong>
                </div>
                <div className="quick-stat-card">
                  <span>Alerts</span>
                  <strong>{user.isBlocked ? 1 : 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="profile-main">
            <section className="profile-card profile-dashboard-card">
              <div className="dashboard-card-header">
                <div>
                  <p className="dashboard-card-label">Profile Dashboard</p>
                  <h2>Manage profile, security, assets and activities</h2>
                </div>
                <div className="dashboard-card-actions">
                  <button className="topbar-btn topbar-btn-primary">Download Profile</button>
                  <button className="topbar-btn topbar-btn-outline">View Reports</button>
                </div>
              </div>
            </section>

            <div className="profile-info-row">
              <section className="profile-card profile-info-card">
                <div className="card-title">Personal Information</div>
                <div className="info-row"><span>Email</span><strong>{user.email || "sonu@example.com"}</strong></div>
                <div className="info-row"><span>Phone</span><strong>{user.phone_no ? `+91 ${user.phone_no}` : "+91 9876543210"}</strong></div>
                <div className="info-row"><span>Employee ID</span><strong>{user.seqId || "EMP1024"}</strong></div>
                <div className="info-row"><span>Department</span><strong>{user.department || "IT ERP"}</strong></div>
                <div className="info-row"><span>Role</span><strong>{user.roleId?.name || user.role || "Enterprise Admin"}</strong></div>
                <div className="info-row"><span>Last Login</span><strong>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Today"}</strong></div>
              </section>

              <section className="profile-card profile-security-card">
                <div className="card-title">Security Overview</div>
                <div className="info-row"><span>Two Factor Authentication</span><strong className="status-badge status-active">{securityInfo.twoFactor}</strong></div>
                <div className="info-row"><span>Recent Login</span><strong>{securityInfo.recentLogin}</strong></div>
                <div className="info-row"><span>Password Status</span><strong className="status-badge status-warning">{securityInfo.passwordStatus}</strong></div>
              </section>
            </div>

            <section className="profile-card profile-assets-card">
              <div className="card-header-row">
                <div className="card-title">Assigned Assets</div>
                <button className="topbar-btn topbar-btn-primary profile-assign-btn">Assign Asset</button>
              </div>
              <div className="up-table-wrap">
                <table className="up-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedAssets.length > 0 ? (
                      assignedAssets.map((asset) => (
                        <tr key={asset._id}>
                          <td>{asset.assetName}</td>
                          <td>{asset.assetType}</td>
                          <td><span className={`status-pill ${getStatusColor(asset.status)}`}>{asset.status}</span></td>
                          <td><button className="link-button">View</button></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="up-empty">No assets assigned</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="profile-bottom-row">
              <section className="profile-card">
                <div className="card-title">Recent Activity</div>
                <ul className="up-list">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, idx) => (
                      <li key={idx}>{activity}</li>
                    ))
                  ) : (
                    <li className="up-empty">No recent activity</li>
                  )}
                </ul>
              </section>

              <section className="profile-card">
                <div className="card-title">Notifications</div>
                <ul className="up-list">
                  {notificationItems.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </section>
            </div>
          </main>
      </div>
    </>
  );
};

export default UnifiedUserProfilePage;
