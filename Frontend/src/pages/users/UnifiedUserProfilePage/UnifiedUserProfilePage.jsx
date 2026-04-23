import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { fetchUserById } from "../../../services/userApi";
import { authAPI } from "../../../services/api";
import { SetPageTitle } from "../../../components/SetPageTitle/SetPageTitle";
import { PageLoader } from "../../../components/Loader/Loader";
import { ChangePasswordModal } from "../../../components";
import SetPinModal from "../../../components/SetPinModal/SetPinModal";
import PageSidebar from "../../../components/PageSidebar/PageSidebar";
import "./UnifiedUserProfilePage.css";

const UnifiedUserProfilePage = () => {
  const navigate = useNavigate();
  const { id: routeUserId } = useParams();
  const authContext = /** @type {{ user?: any; loading: boolean; logout?: Function }} */ (useAuth());
  const { user: authUser, loading: authLoading, logout } = authContext;

  const [user, setUser] = useState(/** @type {any} */ (null));
  const [assignedAssets, setAssignedAssets] = useState(/** @type {any[]} */ ([]));
  const [loginSessions, setLoginSessions] = useState(/** @type {any[]} */ ([]));
  const [recentActivity, setRecentActivity] = useState(/** @type {string[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [isChangePwdModalOpen, setIsChangePwdModalOpen] = useState(false);
  const [isSetPinModalOpen, setIsSetPinModalOpen] = useState(false);
  const [lastPasswordChangeDate, setLastPasswordChangeDate] = useState(/** @type {string | null} */ (null));
  const [isPinSet, setIsPinSet] = useState(/** @type {boolean | null} */ (null));
  const [showPinNotification, setShowPinNotification] = useState(false);
  const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);
  
  const isOwnProfile = !routeUserId;

  // Derived ID to use as a stable dependency
  const authUserId = authUser?._id || authUser?.id;
  const targetUserId = routeUserId || authUserId;

  // Main data fetching effect - Unified and optimized
  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      // Don't do anything if auth is still loading
      if (authLoading) return;

      // If no user ID is available, we can't fetch anything
      if (!targetUserId) {
        if (mounted) {
          setLoading(false);
          setError("User session expired. Please log in again.");
        }
        return;
      }

      try {
        if (mounted) setLoading(true);

        // 1. Fetch User Profile Data
        let userData = isOwnProfile ? authUser : null;
        try {
          const apiData = await fetchUserById(targetUserId);
          if (apiData) {
            userData = {
              ...(userData || {}),
              ...apiData,
              _id: apiData._id || apiData.id || userData?._id,
              status: apiData.isActive !== undefined
                ? (apiData.isActive ? "Active" : "Inactive")
                : userData?.status,
            };
          }
        } catch (fetchErr) {
          console.warn("[Profile] Could not fetch user from API:", fetchErr);
          // If it's own profile, we can fallback to authUser if API fails
          if (!isOwnProfile && !userData) {
            throw new Error("Could not load user profile");
          }
        }

        // 2. Fetch PIN Status (only for own profile)
        let pinStatus = null;
        if (isOwnProfile) {
          try {
            const response = await authAPI.checkPinStatus();
            pinStatus = response.data?.data?.isPinSet || false;
          } catch (err) {
            console.error("Failed to fetch PIN status:", err);
          }
        }

        // 3. Fetch Password History
        let pwdDate = null;
        try {
          const response = await authAPI.getPasswordChangeHistory(1);
          const history = response.data?.data?.history || [];
          if (history.length > 0) {
            const changeDate = new Date(history[0].changedAt);
            pwdDate = new Intl.DateTimeFormat("en-IN", {
              year: "numeric", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            }).format(changeDate);
          }
        } catch (err) {
          console.error("Failed to fetch password history:", err);
        }

        // 4. Update state with all gathered data at once
        if (mounted) {
          setUser(userData);
          setIsPinSet(pinStatus);
          setLastPasswordChangeDate(pwdDate);
          
          // Show PIN notification if not set (for own profile)
          if (pinStatus === false && isOwnProfile) {
            setShowPinNotification(true);
            setTimeout(() => {
              if (mounted) setShowPinNotification(false);
            }, 5000);
          }

          // Set Mock Data (until real APIs are available)
          setAssignedAssets([
            { _id: "1", assetCode: "DEL-LT-001", assetName: "Dell Latitude", assetType: "Laptop", status: "Assigned" },
            { _id: "2", assetCode: "HP-PR-005", assetName: "HP Printer", assetType: "Printer", status: "Repair Pending" },
            { _id: "3", assetCode: "LEN-MB-002", assetName: "Lenovo Monitor", assetType: "Monitor", status: "Assigned" },
          ]);

          setLoginSessions([
            { device: "Chrome", location: "Gurgaon", lastActive: "Active Now", timestamp: new Date() },
            { device: "Firefox", location: "Delhi", lastActive: "Yesterday", timestamp: new Date(Date.now() - 86400000) },
          ]);

          setRecentActivity([
            "Updated asset #A1023",
            "Requested software installation",
            "Approved upgrade request",
            "Logged in from Chrome - Gurgaon",
          ]);

          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Error loading profile");
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
    // Dependency on targetUserId (string) ensures this only runs when the user ID changes
    // Dependency on authLoading ensures we wait for auth to stabilize
  }, [targetUserId, authLoading, isOwnProfile]);

  // Close sidebar when navigating to a different profile or when page loads
  useEffect(() => {
    setProfileSidebarOpen(false);
  }, [routeUserId]);

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
    lastPasswordChange: lastPasswordChangeDate || "Never",
  };

  // Handle logout all devices
  const handleLogoutAllDevices = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout from all devices? You will be logged out immediately."
    );
    
    if (!confirmed) return;

    try {
      await authAPI.logoutAll();
      alert("Successfully logged out from all devices. Please login again.");
      logout?.();
      navigate("/login");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to logout from all devices";
      alert(errorMsg);
      console.error("Logout all devices error:", err);
    }
  };


  const sidebarMenuItems = [
    {
      key: "edit",
      label: "Edit Profile",
      icon: null,
      onClick: () => {} // Logic to be added if needed
    },
    {
      key: "password",
      label: "Change Password",
      onClick: () => setIsChangePwdModalOpen(true)
    },
    {
      key: "pin",
      label: isPinSet ? "Update PIN" : "Set PIN",
      onClick: () => setIsSetPinModalOpen(true)
    },
    {
      key: "logout-all",
      label: "Logout All Devices",
      onClick: handleLogoutAllDevices
    }
  ];

  const sidebarHeader = (
    <div className="sidebar-top">
      <div className="sidebar-avatar">{getInitials(user.name)}</div>
      <div>
        <h2>{user.name}</h2>
        <p><span>ID : </span> {user.roleId?.name || user.role || "NA"}</p>
      </div>
    </div>
  );

  const sidebarFooter = (
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
  );

  return (
    <>
      <SetPageTitle title={`${user.name} - User Profile`} />
      <div className="unified-profile-page">
        <PageSidebar
          activeTab=""
          onTabChange={() => {}}
          menuItems={sidebarMenuItems}
          header={sidebarHeader}
          footer={sidebarFooter}
          title="Profile"
          initials={getInitials(user.name)}
          storageKey="profile-hamburger-pos"
          idPrefix="profile"
        />

        <main className="profile-main">
            {/* PIN Not Set Notification */}
            {showPinNotification && (
              <div className="pin-notification-toast">
                <div className="notification-content">
                  <svg className="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Please set a PIN for quick re-authentication</span>
                </div>
                <button 
                  className="notification-close"
                  onClick={() => setShowPinNotification(false)}
                  aria-label="Close notification"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}

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
                <div className="info-row"><span>Last Password Change</span><strong className="status-badge status-warning">{securityInfo.lastPasswordChange}</strong></div>
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

          {/* Change Password Modal */}
          <ChangePasswordModal
            isOpen={isChangePwdModalOpen}
            onClose={() => setIsChangePwdModalOpen(false)}
          />

          {/* Set/Update PIN Modal */}
          <SetPinModal
            isOpen={isSetPinModalOpen}
            onClose={() => setIsSetPinModalOpen(false)}
            isUpdate={isPinSet}
            onSuccess={() => {
              setIsPinSet(true);
              setShowPinNotification(false);
            }}
          />
      </div>
    </>
  );
};

export default UnifiedUserProfilePage;
