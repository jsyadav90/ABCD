/**
 * Page: Assets List
 * Description: Assets ka industry-standard dashboard view with summary cards aur filtered table.
 * Logics:
 * - Top cards show category-wise counts
 * - Tabs se category filter
 * - Table me assets list with actions
 */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./asset.css";
import Button from "../../components/Button/Button.jsx";
import Table from "../../components/Table/Table.jsx";
import Card from "../../components/Card/Card.jsx";
import FilterPopup from "../../components/Filter/FilterPopup.jsx";
import FilterDisplay from "../../components/Filter/FilterDisplay.jsx";
import { PageLoader } from "../../components/Loader/Loader.jsx";
import { ErrorNotification } from "../../components/ErrorBoundary/ErrorNotification.jsx";
import StatusChangeModal from "../../components/StatusChangeModal/StatusChangeModal.jsx";
import { fetchAllAssets, fetchAssetCategories, fetchAssetDetailsById, deleteAsset, toggleAssetStatus } from "../../services/assetApi.js";
import { getBranchName } from "../../utils/branchUtils.js";
import { getSelectedBranch, onBranchChange } from "../../utils/scope";
import { authAPI } from "../../services/api.js";
import { fetchBranchesForDropdown } from "../../services/userApi.js";
import { getTooltipDetails, highlightText } from "./utils/assetUtils.jsx";
import { toCapitalizedCase } from "../../utils/string.jsx";
import { hasPermission } from "../../utils/permissionHelper.js";
const pageSize = Number(import.meta.env.VITE_PAGE_SIZE) || 20;

const tabs = ["ALL", "FIXED", "PERIPHERAL", "CONSUMABLE", "INTANGIBLE"];

const AssetPage = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [assetCategories, setAssetCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(getSelectedBranch() || "");
  const [visibleAssets, setVisibleAssets] = useState([]);
  const [branches, setBranches] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilterStatus, setAppliedFilterStatus] = useState("ACTIVE");
  const [appliedFilterCategory, setAppliedFilterCategory] = useState("ALL");
  const [appliedFilterType, setAppliedFilterType] = useState("ALL");
  const [appliedFilterBranch, setAppliedFilterBranch] = useState("ALL");
  const [pendingFilterStatus, setPendingFilterStatus] = useState("ACTIVE");
  const [pendingFilterCategory, setPendingFilterCategory] = useState("ALL");
  const [pendingFilterType, setPendingFilterType] = useState("ALL");
  const [pendingFilterBranch, setPendingFilterBranch] = useState("ALL");
  const [userBranchIds, setUserBranchIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const filterButtonRef = useRef(null);

  // Modal state for status change
  const [statusChangeModal, setStatusChangeModal] = useState({
    isOpen: false,
    assetId: null,
    entityType: 'asset',
    entityName: null,
    newStatus: null,
  });

  useEffect(() => {
    if (isFilterOpen) {
      setPendingFilterStatus(appliedFilterStatus);
      setPendingFilterCategory(appliedFilterCategory);
      setPendingFilterType(appliedFilterType);
      setPendingFilterBranch(appliedFilterBranch);
    }
  }, [isFilterOpen]);

  useEffect(() => {
    let isMounted = true;
    let assetsLoaded = false;
    let profileLoaded = false;
    let categoriesLoaded = false;

    const checkAllLoaded = () => {
      if (isMounted && assetsLoaded && profileLoaded && categoriesLoaded) {
        setInitialLoading(false);
      }
    };

    const loadAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllAssets();
        const uniqueData = data.filter((asset, index, self) =>
          self.findIndex(a => a._id === asset._id) === index
        );
        if (isMounted) {
          setAssets(uniqueData);
          assetsLoaded = true;
          checkAllLoaded();
        }
      } catch (err) {
        console.error("Failed to fetch assets", err);
        if (isMounted) {
          setError(err.message || "Failed to load assets");
          assetsLoaded = true;
          checkAllLoaded();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const loadUserProfile = async () => {
      try {
        const resp = await authAPI.getProfile();
        const userInfo = resp.data?.data?.user || {};

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
            if (b.branchId) return String(b.branchId);
            return String(b.branchName || b.name || '');
          }
          return String(b);
        }).filter(Boolean);

        if (isMounted) setUserBranchIds(branchIds);

        const branchesData = await fetchBranchesForDropdown(userInfo.organizationId);
        if (isMounted) {
          setBranches(branchesData);
          if (branchIds.length === 0) {
            setAppliedFilterBranch("ALL");
            setPendingFilterBranch("ALL");
          } else if (branchIds.length === 1) {
            setAppliedFilterBranch(branchIds[0]);
            setPendingFilterBranch(branchIds[0]);
          } else {
            setAppliedFilterBranch("ALL");
            setPendingFilterBranch("ALL");
          }
          profileLoaded = true;
          checkAllLoaded();
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        if (isMounted) {
          setAppliedFilterBranch("ALL");
          setPendingFilterBranch("ALL");
          profileLoaded = true;
          checkAllLoaded();
        }
      }
    };

    const loadCategories = async () => {
      try {
        const data = await fetchAssetCategories();
        if (isMounted) {
          setAssetCategories(data);
          categoriesLoaded = true;
          checkAllLoaded();
        }
      } catch (err) {
        console.error("Failed to fetch asset categories", err);
        if (isMounted) {
          categoriesLoaded = true;
          checkAllLoaded();
        }
      }
    };

    loadAssets();
    loadUserProfile();
    loadCategories();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const off = onBranchChange((branchId) => {
      setSelectedBranch(branchId || "");
    });
    return off;
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is not on hamburger menu or dropdown
      if (!e.target.closest(".asset-actions")) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId]);


  useEffect(() => {
    if (!selectedBranch || selectedBranch === "__ALL__") {
      setVisibleAssets(assets);
      return;
    }
    const filtered = assets.filter((asset) => {
      const branchId = asset.branchId;
      if (!branchId) return false;
      if (typeof branchId === "string") {
        return branchId === selectedBranch;
      }
      if (typeof branchId === "object" && branchId?._id) {
        return String(branchId._id) === selectedBranch;
      }
      return false;
    });
    setVisibleAssets(filtered);
  }, [selectedBranch, assets]);

  const statusOptions = useMemo(() => {
    return ["ALL", "ACTIVE", "INACTIVE"];
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map();
    assetCategories.forEach((cat) => {
      if (cat?._id) {
        map.set(String(cat._id), cat.name || cat.code || String(cat._id));
      }
    });
    return map;
  }, [assetCategories]);

  const getCategoryName = useCallback((assetCategory) => {
    if (!assetCategory) return "";

    if (typeof assetCategory === "object") {
      if (assetCategory.name) return assetCategory.name;
      if (assetCategory._id) {
        const mapped = categoryMap.get(String(assetCategory._id));
        if (mapped) return mapped;
        return assetCategory.name || assetCategory.value || String(assetCategory._id);
      }
      if (assetCategory.value) return assetCategory.value;
      return String(assetCategory);
    }

    if (typeof assetCategory === "string") {
      const mapped = categoryMap.get(assetCategory);
      if (mapped) return mapped;
      return assetCategory;
    }

    return String(assetCategory);
  }, [categoryMap]);

  const categoryOptions = useMemo(() => {
    // Build ONLY from assetCategories fetched from backend
    const values = new Set(["ALL"]);

    assetCategories.forEach((cat) => {
      if (cat?.name) {
        values.add(String(cat.name).trim().toUpperCase());
      }
    });

    return ["ALL", ...Array.from(values).filter((v) => v !== "ALL").sort()];
  }, [assetCategories]);

  const branchOptions = useMemo(() => {
    const options = [];

    // Allow list: assigned branches from user profile, else all branches from API
    const allowedBranchIds = userBranchIds.length > 0
      ? userBranchIds
      : branches.map((b) => String(b._id || b.id || b.branchId || ''))
          .filter(Boolean);

    const assignedBranchItems = allowedBranchIds
      .map((branchId) => {
        const id = String(branchId);
        const branch = branches.find(
          (b) => String(b._id) === id || String(b.id) === id || String(b.branchId) === id
        );
        return {
          id,
          label: branch?.branchName || branch?.name || id,
        };
      })
      .filter((x, idx, arr) => x.id && arr.findIndex((item) => item.id === x.id) === idx);

    // Add "ALL" if user has multiple assigned branches
    if (assignedBranchItems.length > 1) {
      options.push("ALL");
    }

    assignedBranchItems.forEach((item) => {
      options.push(item.id);
    });

    // If still no options, fallback to ALL
    if (options.length === 0) {
      options.push("ALL");
    }

    return options;
  }, [userBranchIds, branches]);

  const getBranchDisplayName = useCallback((branchId) => {
    if (branchId === "ALL") return "All Branches";
    const branch = branches.find(
      (b) => String(b._id) === branchId || String(b.id) === branchId || String(b.branchId) === branchId
    );
    return branch ? branch.branchName || branch.name || branchId : branchId;
  }, [branches]);

  // Function to get filters that should be displayed (non-default values)
  const getActiveFilters = useCallback(() => {
    const filters = [];
    
    // Branch: show if not "ALL" (default)
    if (appliedFilterBranch !== "ALL") {
      filters.push({
        label: "Branch",
        value: getBranchDisplayName(appliedFilterBranch),
      });
    }
    
    // Category: show if not "ALL" (default)
    if (appliedFilterCategory !== "ALL") {
      filters.push({
        label: "Category",
        value: appliedFilterCategory,
      });
    }
    
    // Type: show if not "ALL" (default)
    if (appliedFilterType !== "ALL") {
      filters.push({
        label: "Type",
        value: appliedFilterType,
      });
    }
    
    // Status: show if not "ALL" (default)
    if (appliedFilterStatus !== "ALL") {
      filters.push({
        label: "Status",
        value: appliedFilterStatus,
      });
    }
    
    return filters;
  }, [appliedFilterBranch, appliedFilterCategory, appliedFilterType, appliedFilterStatus, getBranchDisplayName]);

  const typeOptions = useMemo(() => {
    const values = new Set();
    
    // Filter assets by pending category first
    let baseAssets = assets;
    if (pendingFilterCategory && pendingFilterCategory !== "ALL") {
      baseAssets = assets.filter((a) => {
        const assetCat = String(getCategoryName(a.assetCategory) || "").trim().toUpperCase();
        return assetCat === pendingFilterCategory.trim().toUpperCase();
      });
    }
    
    // Then get types from filtered assets
    baseAssets.forEach((a) => {
      if (a.assetType) {
        const normalized = String(a.assetType).trim().toUpperCase();
        values.add(normalized);
      }
    });
    return ["ALL", ...Array.from(values).sort()];
  }, [assets, pendingFilterCategory, getCategoryName]);

  const activeVisibleAssets = useMemo(() => {
    return visibleAssets.filter((a) => a.isActive !== false);
  }, [visibleAssets]);

  const categoryCounts = useMemo(() => {
    const counts = { ALL: activeVisibleAssets.length };
    
    // Build counts dynamically from assetCategories
    assetCategories.forEach((cat) => {
      const categoryName = String(cat.name || "").trim().toUpperCase();
      const categoryCount = activeVisibleAssets.filter(a => {
        const assetCat = String(getCategoryName(a.assetCategory) || "").trim().toUpperCase();
        return assetCat === categoryName;
      }).length;
      counts[categoryName] = categoryCount;
    });
    
    return counts;
  }, [activeVisibleAssets, assetCategories, getCategoryName]);

  const goAddAsset = () => {
    navigate("/assets/add");
  };

  const handleDeleteAsset = async (assetId) => {
    const asset = assets.find(a => a._id === assetId);
    const confirmed = window.confirm(
      `Are you sure you want to delete ${asset?.model || asset?.serialNumber || "this asset"}?`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      await deleteAsset(assetId);
      
      // Remove from local state
      setAssets(prev => prev.filter(a => a._id !== assetId));
      setError(null);
    } catch (err) {
      console.error("Delete failed", err);
      setError(err.message || "Failed to delete asset");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAssetStatus = (assetId, isActive) => {
    const asset = assets.find(a => a._id === assetId);
    setStatusChangeModal({
      isOpen: true,
      assetId,
      entityType: 'asset',
      entityName: asset?.assetTag || asset?.serialNumber || "this asset",
      newStatus: isActive,
    });
  };

  const handleStatusChangeConfirm = async (reason) => {
    const { assetId, newStatus } = statusChangeModal;
    
    try {
      setLoading(true);
      setError(null);
      await toggleAssetStatus(assetId, newStatus, reason);
      
      // Update local state
      setAssets(prev => prev.map(a => 
        a._id === assetId ? { ...a, isActive: newStatus } : a
      ));
      setError(null);
    } catch (err) {
      console.error("Status toggle failed", err);
      setError(err.message || "Failed to update asset status");
    } finally {
      setLoading(false);
      setStatusChangeModal({ isOpen: false, assetId: null, entityType: 'asset', entityName: null, newStatus: null });
    }
  };

  const handleStatusChangeCancel = () => {
    setStatusChangeModal({ isOpen: false, assetId: null, entityType: 'asset', entityName: null, newStatus: null });
  };

  const capitalizeText = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredAssets = useMemo(() => {
    let list = visibleAssets;

    // Filter by Branch
    if (appliedFilterBranch !== "ALL") {
      list = list.filter((a) => {
        const branchId = a.branchId;
        if (!branchId) return false;
        if (typeof branchId === "string") {
          return branchId === appliedFilterBranch;
        }
        if (typeof branchId === "object" && branchId?._id) {
          return String(branchId._id) === appliedFilterBranch;
        }
        return false;
      });
    }

    // Filter by Status (using isActive field)
    if (appliedFilterStatus === "ALL") {
      // Show both active and inactive
      list = list; // No filter
    } else if (appliedFilterStatus === "ACTIVE") {
      // Show only active - check for true, and treat undefined as active
      list = list.filter((a) => a.isActive !== false);
    } else if (appliedFilterStatus === "INACTIVE") {
      // Show only inactive - must be explicitly false
      list = list.filter((a) => a.isActive === false);
    }

    // Filter by Category
    if (appliedFilterCategory !== "ALL") {
      list = list.filter((a) => {
        const assetCat = String(getCategoryName(a.assetCategory) || "").trim().toUpperCase();
        return assetCat === appliedFilterCategory.trim().toUpperCase();
      });
    }

    // Filter by Type
    if (appliedFilterType !== "ALL") {
      list = list.filter((a) => {
        const assetType = String(a.assetType || "").trim().toUpperCase();
        return assetType === appliedFilterType.trim().toUpperCase();
      });
    }

    return list;
  }, [visibleAssets, appliedFilterStatus, appliedFilterCategory, appliedFilterType, appliedFilterBranch]);

  const shouldShowBranchField = branchOptions.length > 1 && (!selectedBranch || selectedBranch === "__ALL__" || selectedBranch === "");

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
      key: 'category',
      label: 'Category',
      type: 'select',
      value: pendingFilterCategory,
      onChange: (e) => setPendingFilterCategory(e.target.value),
      options: categoryOptions,
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      value: pendingFilterType,
      onChange: (e) => setPendingFilterType(e.target.value),
      options: typeOptions,
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

  const tableExtraActions = null;

  const columns = [
    
    
    // { 
    //   header: "Asset ID", 
    //   key: "assetId", 
    //   sortable: true,
    //   render: (row, search) => (
    //     <button
    //       onClick={() => {
    //         localStorage.setItem('lastassetType', row.assetType || 'cpu');
    //         navigate(`/assets/${row._id}`);
    //       }}
    //       style={{
    //         background: 'none',
    //         border: 'none',
    //         // color: '#0284c7',
    //         cursor: 'pointer',
    //         fontSize: 'inherit',
    //         fontWeight: 'inherit',
    //         padding: 0,
    //       }}
    //       title={getTooltipDetails(row)}
    //     >
    //       {highlightText(row.assetId, search)}
    //     </button>
    //   )
    // },
    { 
      header: "Asset Tag", 
      key: "assetTag", 
      sortable: true,
      render: (row, search) => (
        <button
          onClick={() => {
            localStorage.setItem('lastassetType', row.assetType || 'cpu');
            navigate(`/assets/${row._id}`);
          }}
          style={{
            background: 'none',
            border: 'none',
            // color: '#0284c7',
            cursor: 'pointer',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            padding: 0,
          }}
          title={getTooltipDetails(row)}
        >
          {highlightText(row.assetTag, search)}
        </button>
      )
    },

    { header:"Asset ID", key: "assetId", sortable: true, render: (row, search) => highlightText(row.assetId, search)},
    // {header: "Asset Tag", key: "assetTag", sortable: true, render: (row, search) => highlightText(row.assetTag, search)},

    { header: "Asset Type / Sub Type", key: "assetType", sortable: true, render: (row, search) => {
      const typeDisplay = row.assetType === "cpu" || row.assetType === "Cpu" || row.assetType === "CPU" ? "CPU" : toCapitalizedCase(String(row.assetType || "").trim());
      const subTypeDisplay = row.assetSubType && String(row.assetSubType).trim() ? ` (${String(row.assetSubType).trim()})` : "";
      return highlightText(typeDisplay + subTypeDisplay, search);
    } },

    // {header: "Sub Type", key: "assetSubType", sortable: true, render: (row, search) => highlightText(row.assetType === "cpu" ? "CPU"  :  toCapitalizedCase(getCategoryName(row.assetCategory || row.assetType)), search)},

    {
      header: "Category",
      key: "assetCategory",
      sortable: true,
      render: (row, search) => highlightText(getCategoryName(row.assetCategory), search),
    },
    { 
      header: "Branch", 
      key: "branchId", 
      sortable: true,
      render: (row, search) => highlightText(getBranchName(row.branchId, branches), search)
    },
    { header: "Model", key: "model", sortable: true },
    { header: "Serial Number", key: "serialNumber", sortable: true },
    { header: "Manufacturer", key: "manufacturer", sortable: true },
    {
      header: "Actions",
      key: "actions",
      render: (row) => (
        <div className="asset-actions">
          {/* View Button */}
          <button
            className="asset-action-btn asset-action-btn--view"
            onClick={() => navigate(`/assets/${row._id}`)}
            title="View asset details"
          >
            <span className="material-icons">visibility</span>
          </button>

          {/* Hamburger Menu */}
          <button
            className="asset-hamburger-btn"
            onClick={() =>
              setOpenMenuId(openMenuId === row._id ? null : row._id)
            }
            title="More actions"
          >
            <span className="material-icons">more_vert</span>
          </button>

          {openMenuId === row._id && (
            <div className="asset-action-dropdown-menu">
              {hasPermission("assets:rows_buttons:edit") && (
                <button
                  className="asset-action-menu-item"
                  onClick={() => {
                    navigate(`/assets/edit/${row._id}`);
                    setOpenMenuId(null);
                  }}
                >
                  Edit
                </button>
              )}

              {!row.isActive ? (
                <>
                  {hasPermission("assets:rows_buttons:enable") && (
                    <button
                      className="asset-action-menu-item asset-action-menu-item--success"
                      onClick={() => {
                        handleToggleAssetStatus(row._id, true);
                        setOpenMenuId(null);
                      }}
                    >
                      Enable
                    </button>
                  )}
                </>
              ) : (
                <>
                  {hasPermission("assets:rows_buttons:disable") && (
                    <button
                      className="asset-action-menu-item asset-action-menu-item--warning"
                      onClick={() => {
                        handleToggleAssetStatus(row._id, false);
                        setOpenMenuId(null);
                      }}
                    >
                      Disable
                    </button>
                  )}
                </>
              )}

              {hasPermission("assets:rows_buttons:delete") && (
                <button
                  className="asset-action-menu-item asset-action-menu-item--danger"
                  onClick={() => {
                    handleDeleteAsset(row._id);
                    setOpenMenuId(null);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  if (initialLoading) return <PageLoader />;
  if (error) return <ErrorNotification error={error} onClose={() => setError(null)} />;

  return (
    <div className="asset-page">
      <StatusChangeModal
        isOpen={statusChangeModal.isOpen}
        entityType={statusChangeModal.entityType}
        entityName={statusChangeModal.entityName}
        newStatus={statusChangeModal.newStatus}
        onConfirm={handleStatusChangeConfirm}
        onCancel={handleStatusChangeCancel}
      />
      <div className="asset">
      {/* <div className="asset-breadcrumbs" aria-label="Breadcrumb">
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active" aria-current="page">Assets</span>
      </div> */}
        <div className="asset-header">
          <h1>Assets</h1>

          {hasPermission("assets:page_buttons:add") && (
          <Button variant="primary" aria-label="Add Asset" onClick={goAddAsset}>
            Add Asset
          </Button>
          
        )}
        </div>

      {/* Summary Cards */}
      <div className="asset-summary">
        {/* ALL Card */}
        <Card
          key="ALL"
          title="Total Assets"
          subtitle=""
          footer=""
          className="summary-card"
        >
          <div className="count">{categoryCounts["ALL"] || 0}</div>
        </Card>
        
        {/* Dynamic Category Cards from assetCategories */}
        {assetCategories.map((cat) => {
          const categoryName = String(cat.name || "").trim().toUpperCase();
          const displayName = cat.name || cat.code || "Unknown";
          return (
            <Card
              key={cat._id}
              title={displayName}
              subtitle=""
              footer=""
              className="summary-card"
            >
              <div className="count">{categoryCounts[categoryName] || 0}</div>
            </Card>
          );
        })}
      </div>

      {/* Filter button is moved into table header controls via extraActions prop */}

      <FilterPopup
        isOpen={isFilterOpen}
        anchorRef={filterButtonRef}
        fields={filterFields}
        onClose={() => setIsFilterOpen(false)}
        onReset={() => {
          // Reset pending filters to default values
          setPendingFilterStatus("ACTIVE");
          setPendingFilterCategory("ALL");
          setPendingFilterType("ALL");
          setPendingFilterBranch("ALL");
        }}
        onApply={() => {
          // Apply pending filters and close popup
          setAppliedFilterStatus(pendingFilterStatus);
          setAppliedFilterCategory(pendingFilterCategory);
          setAppliedFilterType(pendingFilterType);
          setAppliedFilterBranch(pendingFilterBranch);
          setIsFilterOpen(false);
        }}
      />

      <div className="asset-content">
        {/* Filter Display Row - Always visible */}
        <FilterDisplay filters={getActiveFilters()} />

        {/* Table always visible - handles empty state internally */}
        {filteredAssets.length === 0 ? (
          <>
            {/* Table header with search/filters button - still visible */}
            <div className="table__options">
              <div className="table__actions">
                <Button ref={filterButtonRef} variant="secondary" size="small" onClick={() => setIsFilterOpen((v) => !v)}>
                  Filters
                </Button>
              </div>
              <div className="table__summary">0 to 0 of 0</div>
            </div>
            {/* Empty state message */}
            <div className="empty-state">
              <div className="empty-icon">[BOX]</div>
              <div className="empty-text">
                {appliedFilterCategory === "ALL" ? "No assets. Click Add Asset to create one." : `No ${capitalizeText(appliedFilterCategory)} assets here.`}
              </div>
            </div>
          </>
        ) : (
          <Table
            columns={columns}
            data={filteredAssets}
            showSearch={true}
            showPagination={true}
            pageSize={pageSize}
            onSelectionChange={() => {}}
            isRowSelectable={() => true}
            rowClassName=""
            extraActions={
              <Button ref={filterButtonRef} variant="secondary" size="small" onClick={() => setIsFilterOpen((v) => !v)}>
                Filters
              </Button>
            }
          />
        )}
      </div>
      </div>
    </div>
  );
};

export default AssetPage;
