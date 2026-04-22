import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { fetchBranchesForDropdown } from "../../services/userApi";
import { getSelectedBranch, getSelectedBranchName, onBranchChange, setSelectedBranch, getSelectedOrgCode, onOrgChange } from "../../utils/scope";
import "./Header.css";

const Header = ({ onToggleSidebar }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const headerRef = useRef(null);
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranchState] = useState(getSelectedBranch());
  const [selectedBranchLabel, setSelectedBranchLabelState] = useState(getSelectedBranchName());
  const [organizationCode, setOrganizationCode] = useState(getSelectedOrgCode());

  const getBranchLabel = (branch) => {
    if (!branch) return "";
    return branch.branchName || branch.name || branch.code || branch.branchCode || "";
  };

  const findBranchLabel = (branchId) => {
    const branch = branches.find(
      (item) => String(item._id) === String(branchId) || String(item.id) === String(branchId) || String(item.branchId) === String(branchId)
    );
    return getBranchLabel(branch);
  };

  useEffect(() => {
    const fetchBranches = async () => {
      if (user?.organizationId) {
        try {
          const branchList = await fetchBranchesForDropdown(user.organizationId);
          setBranches(branchList);
        } catch (error) {
          console.error('Failed to fetch branches:', error);
        }
      }
    };
    fetchBranches();
  }, [user?.organizationId]);

  useEffect(() => {
    const unsubscribe = onOrgChange((orgId, orgName, orgCode) => {
      setOrganizationCode(orgCode);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onBranchChange((branchId, branchName) => {
      setSelectedBranchState(branchId);
      setSelectedBranchLabelState(branchName);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedBranch || selectedBranch === "__ALL__" || selectedBranchLabel) return;
    const branchLabel = findBranchLabel(selectedBranch);
    if (branchLabel) {
      setSelectedBranchLabelState(branchLabel);
      setSelectedBranch(selectedBranch, branchLabel);
    }
  }, [branches, selectedBranch, selectedBranchLabel]);

  const getLogoText = () => {
    if (selectedBranch === "__ALL__") {
      return organizationCode || "ABCD";
    }

    const branchLabel = selectedBranchLabel || findBranchLabel(selectedBranch);
    if (branchLabel) return branchLabel;
    if (selectedBranch && selectedBranch !== "__ALL__") return selectedBranch;
    return organizationCode || "ABCD";
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = () => {
    // Here you can add search logic in the future
    // For now, just close the search bar
    handleSearchClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        handleSearchClose();
      }
    };

    // Only add listener if search is open
    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isSearchOpen]);

  return (
    <header ref={headerRef}>
      <div className="header-left">
        <button
          className="hamburger"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          &#9776;
        </button>

        <div className="logo">
          {/* <Link to="/">ABCD</Link> */}
          <Link to="/">{getLogoText()}</Link>
        </div>
      </div>

      <div className="header-right">
        <div
          className={`search-container ${isSearchOpen ? "search-open" : ""}`}
          id="searchBox"
          role="search"
        >
          <input
            type="text"
            placeholder="Search the application..."
            aria-label="Search the application"
            onBlur={handleSearchClose}
            onKeyPress={handleKeyPress}
            autoFocus={isSearchOpen}
          />

          <div className="search-icon-container">
            <button
              type="button"
              id="searchToggle"
              className="material-icons search-icon"
              aria-label="Search"
              onClick={handleSearchSubmit}
            >
              search
            </button>
          </div>
        </div>

        <button
          type="button"
          className="notification-bell material-icons"
          aria-label="Open notifications"
          title="Notifications"
          onClick={() => {
            // Placeholder for future notification logic
            console.log('Notification bell clicked');
          }}
        >
          notifications
          <span className="notification-count" aria-hidden="true">3</span>
        </button>

        <button
          type="button"
          className="material-icons search-icon-out"
          onClick={handleSearchToggle}
          aria-label="Toggle search"
          aria-expanded={isSearchOpen}
        >
          search
        </button>
      </div>
    </header>
  );
};

export default Header;
