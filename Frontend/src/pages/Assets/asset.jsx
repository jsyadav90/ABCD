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
import { PageLoader } from "../../components/Loader/Loader.jsx";
import { ErrorNotification } from "../../components/ErrorBoundary/ErrorNotification.jsx";
import { fetchAllAssets, fetchAssetCategories } from "../../services/assetApi.js";
import { fetchAllBranches } from "../../services/branchApi.js";
import { getBranchName } from "../../utils/branchUtils.js";
import { getSelectedBranch, onBranchChange } from "../../utils/scope";

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

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilterStatus, setAppliedFilterStatus] = useState("ACTIVE");
  const [appliedFilterCategory, setAppliedFilterCategory] = useState("ALL");
  const [appliedFilterType, setAppliedFilterType] = useState("ALL");
  const [pendingFilterStatus, setPendingFilterStatus] = useState("ACTIVE");
  const [pendingFilterCategory, setPendingFilterCategory] = useState("ALL");
  const [pendingFilterType, setPendingFilterType] = useState("ALL");
  const filterButtonRef = useRef(null);

  useEffect(() => {
    if (isFilterOpen) {
      setPendingFilterStatus(appliedFilterStatus);
      setPendingFilterCategory(appliedFilterCategory);
      setPendingFilterType(appliedFilterType);
    }
  }, [isFilterOpen]);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllAssets();
        // Remove duplicates based on _id
        const uniqueData = data.filter((item, index, self) => 
          self.findIndex(a => a._id === item._id) === index
        );
        setAssets(uniqueData);
        // Debug: log sample monitor rows so we can verify available fields
        try {
          console.debug('Fetched assets sample (first 5 monitors):', uniqueData.filter(a => String(a.itemType || '').toUpperCase() === 'MONITOR').slice(0,5));
        } catch {
          console.debug('Fetched assets (first 5):', uniqueData.slice(0,5));
        }
      } catch (err) {
        console.error("Failed to fetch assets", err);
        setError(err.message || "Failed to load assets");
      } finally {
        setLoading(false);
      }
    };
    loadAssets();
  }, []);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await fetchAllBranches();
        setBranches(data);
      } catch (err) {
        console.error("Failed to fetch branches", err);
        // Don't set error for branches, as it's not critical
      }
    };
    loadBranches();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchAssetCategories();
        setAssetCategories(data);
      } catch (err) {
        console.error("Failed to fetch asset categories", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const off = onBranchChange((branchId) => {
      setSelectedBranch(branchId || "");
    });
    return off;
  }, []);


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

  const getCategoryName = useCallback((itemCategory) => {
    if (!itemCategory) return "";

    if (typeof itemCategory === "object") {
      if (itemCategory.name) return itemCategory.name;
      if (itemCategory._id) {
        const mapped = categoryMap.get(String(itemCategory._id));
        if (mapped) return mapped;
        return itemCategory.name || itemCategory.value || String(itemCategory._id);
      }
      if (itemCategory.value) return itemCategory.value;
      return String(itemCategory);
    }

    if (typeof itemCategory === "string") {
      const mapped = categoryMap.get(itemCategory);
      if (mapped) return mapped;
      return itemCategory;
    }

    return String(itemCategory);
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

  const typeOptions = useMemo(() => {
    const values = new Set();
    
    // Filter assets by pending category first
    let baseAssets = assets;
    if (pendingFilterCategory && pendingFilterCategory !== "ALL") {
      baseAssets = assets.filter((a) => {
        const assetCategory = String(getCategoryName(a.itemCategory) || "").trim().toUpperCase();
        return assetCategory === pendingFilterCategory.trim().toUpperCase();
      });
    }
    
    // Then get types from filtered assets
    baseAssets.forEach((a) => {
      if (a.itemType) {
        const normalized = String(a.itemType).trim().toUpperCase();
        values.add(normalized);
      }
    });
    return ["ALL", ...Array.from(values).sort()];
  }, [assets, pendingFilterCategory]);

  const activeVisibleAssets = useMemo(() => {
    return visibleAssets.filter((a) => a.isActive !== false);
  }, [visibleAssets]);

  const categoryCounts = useMemo(() => {
    const counts = { ALL: activeVisibleAssets.length };
    
    // Build counts dynamically from assetCategories
    assetCategories.forEach((cat) => {
      const categoryName = String(cat.name || "").trim().toUpperCase();
      counts[categoryName] = activeVisibleAssets.filter(a => {
        const assetCategory = String(getCategoryName(a.itemCategory) || "").trim().toUpperCase();
        return assetCategory === categoryName;
      }).length;
    });
    
    return counts;
  }, [activeVisibleAssets, assetCategories, getCategoryName]);

  const goAddItem = () => {
    navigate("/assets/add");
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

    // Filter by Status FIRST (using isActive field)
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
        const assetCategory = String(getCategoryName(a.itemCategory) || "").trim().toUpperCase();
        return assetCategory === appliedFilterCategory.trim().toUpperCase();
      });
    }

    // Filter by Type
    if (appliedFilterType !== "ALL") {
      list = list.filter((a) => {
        const assetType = String(a.itemType || "").trim().toUpperCase();
        return assetType === appliedFilterType.trim().toUpperCase();
      });
    }

    return list;
  }, [visibleAssets, appliedFilterStatus, appliedFilterCategory, appliedFilterType]);

  const filterFields = [
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

  const getTooltipDetails = (row) => {
    const safe = (value) => (value || value === 0 ? value : "N/A");
    const itemType = row.itemType?.toUpperCase();

    const totalRam = Number(row.memory?.totalCapacityGB) || (row.memory?.modules?.reduce((sum, module) => sum + (Number(module.ramCapacityGB) || 0), 0) || 0);
    const totalStorage = Number(row.storage?.totalCapacityGB) || (row.storage?.devices?.reduce((sum, device) => sum + (Number(device.driveCapacityGB) || 0), 0) || 0);

    if (itemType === 'CPU') {
      return `OS: ${safe(row.osName)}, Model: ${safe(row.model)}, CPU: ${safe(row.processorModel)}, RAM: ${totalRam ? `${totalRam}GB` : 'N/A'}, Storage: ${totalStorage ? `${totalStorage}GB` : 'N/A'}`;
    }

    if (itemType === 'LAPTOP') {
      return `OS: ${safe(row.osName)}, Model: ${safe(row.model)}, CPU: ${safe(row.processorModel)}, RAM: ${totalRam ? `${totalRam}GB` : 'N/A'}, Storage: ${totalStorage ? `${totalStorage}GB` : 'N/A'}`;
    }

    if (itemType === 'MONITOR') {
      const size = safe(row.screenSizeInches);
      const resolution = safe(row.resolution);
      const panel = safe(row.panelType ?? row.panel_type);
      const refresh = safe(row.refreshRateHz ?? row.refresh_rate_hz);
      return `Size: ${size}", Resolution: ${resolution}, Panel: ${panel}, Refresh Rate: ${refresh}Hz`;
    }

    // Default fallback
    return `Model: ${safe(row.model)}, Serial: ${safe(row.serialNumber)}, Manufacturer: ${safe(row.manufacturer)}`;
  };

  const columns = [
    { 
      header: "Item ID", 
      key: "itemId", 
      sortable: true,
      tooltip: (row) => getTooltipDetails(row)
    },
    { header: "Type", key: "itemType", sortable: true },
    {
      header: "Category",
      key: "itemCategory",
      sortable: true,
      render: (row) => getCategoryName(row.itemCategory),
    },
    { 
      header: "Branch", 
      key: "branchId", 
      sortable: true,
      render: (row) => getBranchName(row.branchId, branches)
    },
    { header: "Model", key: "model", sortable: true },
    { header: "Serial Number", key: "serialNumber", sortable: true },
    { header: "Manufacturer", key: "manufacturer", sortable: true },
    {
      header: "Actions",
      key: "actions",
      render: (row) => (
        <div className="asset-actions">
          <Button variant="secondary" size="small" onClick={() => navigate(`/assets/${row._id}`)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <PageLoader />;
  if (error) return <ErrorNotification error={error} onClose={() => setError(null)} />;

  return (
    <div className="asset-page">
      <div className="asset">
      {/* <div className="asset-breadcrumbs" aria-label="Breadcrumb">
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active" aria-current="page">Assets</span>
      </div> */}
        <div className="asset-header">
          <h1>Assets</h1>
          <Button variant="primary" aria-label="Add Item" onClick={goAddItem}>
            Add Item
          </Button>
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

      <div className="asset-tabs" role="region" aria-label="Asset Filters">
        <Button ref={filterButtonRef} variant="secondary" size="small" onClick={() => setIsFilterOpen((v) => !v)}>
          Filters
        </Button>

        <FilterPopup
          isOpen={isFilterOpen}
          anchorRef={filterButtonRef}
          fields={filterFields}
          onClose={() => setIsFilterOpen(false)}
          onReset={() => {
            // Reset pending filters to currently applied filters
            setPendingFilterStatus(appliedFilterStatus);
            setPendingFilterCategory(appliedFilterCategory);
            setPendingFilterType(appliedFilterType);
          }}
          onApply={() => {
            // Apply pending filters and close popup
            setAppliedFilterStatus(pendingFilterStatus);
            setAppliedFilterCategory(pendingFilterCategory);
            setAppliedFilterType(pendingFilterType);
            setIsFilterOpen(false);
          }}
        />
      </div>

      <div className="asset-content">
        {filteredAssets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-text">
              {appliedFilterCategory === "ALL" ? "No items. Click Add Item to create one." : `No ${capitalizeText(appliedFilterCategory)} items here.`}
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredAssets}
            showSearch={true}
            showPagination={true}
            pageSize={20}
            onSelectionChange={() => {}}
            isRowSelectable={() => true}
            rowClassName=""
          />
        )}
      </div>
      </div>
    </div>
  );
};

export default AssetPage;
