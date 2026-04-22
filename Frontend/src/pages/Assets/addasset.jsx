import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from '../../components/Select/Select.jsx';
import './AddAsset.css';
import FormRenderer from './components/FormRenderer.jsx';
import { fetchAssetCategories, fetchAssetTypesByCategory, createAsset, fetchLookupsByCategory, getNextAssetId, getNextAssetTag } from '../../services/assetApi.js';
import { fetchBranchesForDropdown } from '../../services/userApi.js';
import { getAssetFieldConfig } from './config/assetFieldConfig.js';
import { getSelectedBranch } from '../../utils/scope.js';
import { 
  calculateTotalAmount, 
  getWarrantyStartDateFromPurchase,
  calculateWarrantyEndDateFromDuration,
  calculateWarrantyStatus,
  validateWarrantyFields,
  validatePurchaseFields
} from './utils/warrantyCalculations.js';

const normalizeTypeKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

// Helper for lookup option placeholders
const isLookupPlaceholder = (options) => options && typeof options === 'object' && options.__lookupCategory;

// Scan sections and resolve lookups from backend to real select options
const resolveLookupOptions = async (sections) => {
  if (!Array.isArray(sections)) return sections;

  // Collect unique lookup categories from form config
  const categories = new Set();
  sections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      if (isLookupPlaceholder(field.options)) {
        const cat = String(field.options.__lookupCategory || '').trim().toLowerCase();
        if (cat) categories.add(cat);
      }
    });
  });

  if (categories.size === 0) return sections;

  // Fetch all category lookups in parallel
  const lookupResult = {};
  await Promise.all(
    Array.from(categories).map(async (category) => {
      try {
        const assets = await fetchLookupsByCategory(category);
        lookupResult[category] = Array.isArray(assets) ? assets : [];
      } catch (error) {
        console.error(`lookupCategory fetch failed for ${category}:`, error);
        lookupResult[category] = [];
      }
    })
  );

  // Replace placeholder objects with actual option arrays
  const updatedSections = sections.map((section) => ({
    ...section,
    fields: (section.fields || []).map((field) => {
      if (isLookupPlaceholder(field.options)) {
        const cat = String(field.options.__lookupCategory || '').trim().toLowerCase();
        const assets = lookupResult[cat] || [];
        return {
          ...field,
          options: assets
            .filter((asset) => asset && asset.name)
            .map((asset) => ({ value: asset.name, label: asset.name })),
        };
      }
      return field;
    }),
  }));

  return updatedSections;
};

const AddAsset = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(''); // normalized name for config lookup
  const [selectedAssetId, setSelectedAssetId] = useState(''); // assetType._id for API
  const [categories, setCategories] = useState([]);
  const [assetTypes, setassetTypes] = useState([]);
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [branches, setBranches] = useState([]);
  const [userSelectedBranch, setUserSelectedBranch] = useState(''); // from dashboard
  const [isBranchFieldDisabled, setIsBranchFieldDisabled] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const selectedCategoryName = useMemo(() => {
    const category = categories.find((c) => c._id === selectedCategory);
    return category?.name || '';
  }, [categories, selectedCategory]);

  const buildBaseFormData = () => {
    const baseData = {};
    if (selectedCategoryName) {
      baseData.assetcategory = selectedCategoryName;
    }
    if (isBranchFieldDisabled && userSelectedBranch) {
      baseData.branch = userSelectedBranch;
      baseData.branchId = userSelectedBranch;
    }
    if (formData.assetId) {
      baseData.assetId = formData.assetId;
    }
    return baseData;
  };

  // Extract default values from sections
  const extractDefaultValues = (sections) => {
    const defaults = {};
    sections.forEach((section) => {
      if (Array.isArray(section.fields)) {
        section.fields.forEach((field) => {
          if (field.defaultValue !== undefined) {
            defaults[field.name] = field.defaultValue;
          }
        });
      }
    });
    return defaults;
  };

  // Load categories and branches on mount
  useEffect(() => {
    let isMounted = true;
    let categoriesLoaded = false;
    let branchesLoaded = false;
    let assetIdLoaded = false;

    const checkAllLoaded = () => {
      if (isMounted && categoriesLoaded && branchesLoaded && assetIdLoaded) {
        setInitialLoading(false);
      }
    };

    const loadCategoriesAndBranches = async () => {
      try {
        const categoryData = await fetchAssetCategories();
        if (isMounted) {
          setCategories(categoryData);
          categoriesLoaded = true;
          checkAllLoaded();
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        if (isMounted) {
          setCategories([]);
          setErrorMessage('Unable to load asset categories. Please refresh the page.');
          categoriesLoaded = true;
          checkAllLoaded();
        }
      }

      try {
        const branchData = await fetchBranchesForDropdown();
        if (isMounted) {
          setBranches(branchData);
          branchesLoaded = true;
          checkAllLoaded();
        }
      } catch (error) {
        console.error('Failed to load branches:', error);
        if (isMounted) {
          setBranches([]);
          branchesLoaded = true;
          checkAllLoaded();
        }
      }

      try {
        const nextAssetId = await getNextAssetId();
        if (isMounted) {
          setFormData((prev) => ({
            ...prev,
            assetId: nextAssetId,
          }));
          assetIdLoaded = true;
          checkAllLoaded();
        }
      } catch (error) {
        console.error('Failed to load next asset ID:', error);
        if (isMounted) {
          assetIdLoaded = true;
          checkAllLoaded();
        }
      }

      if (isMounted) {
        const dashboardBranch = getSelectedBranch();
        if (dashboardBranch && dashboardBranch !== '') {
          setUserSelectedBranch(dashboardBranch);
          setIsBranchFieldDisabled(dashboardBranch !== '__ALL__');
          setFormData((prev) => ({
            ...prev,
            branch: dashboardBranch,
            branchId: dashboardBranch,
          }));
        }
      }
    };
    loadCategoriesAndBranches();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setassetTypes([]);
      setSelectedAsset('');
      setSelectedAssetId('');
      setSections([]);
      setFormData(buildBaseFormData());
      return;
    }

    const loadassetTypes = async () => {
      try {
        const data = await fetchAssetTypesByCategory(selectedCategory);
        setassetTypes(data);
        setSelectedAsset('');
        setSelectedAssetId('');
        setSections([]);
        setFormData(buildBaseFormData());
      } catch (error) {
        console.error('Failed to load item types:', error);
        setassetTypes([]);
        setSections([]);
        setFormData(buildBaseFormData());
      }
    };

    loadassetTypes();
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedAsset) {
      setSections([]);
      setFormData(buildBaseFormData());
      return;
    }

    const loadConfig = async () => {
      try {
        setFormData({
          ...buildBaseFormData(),
          assetType: selectedAsset,
          assetTypeId: selectedAssetId,
        });

        const config = await getAssetFieldConfig(selectedAsset);
        let formSections = config.sections || [];

        // Resolve explicit lookup placeholders in config to concrete select options
        formSections = await resolveLookupOptions(formSections);

        setSections(formSections);

        // Apply default values from config to formData
        const defaults = extractDefaultValues(formSections);
        setFormData((prev) => ({ ...prev, ...defaults }));
      } catch (error) {
        console.error('Failed to load item field config:', error);
        setSections([]);
      }
    };

    loadConfig();
  }, [selectedAsset, selectedCategoryName]);

  const categoryOptions = categories.map((cat) => ({
    value: cat._id,
    label: cat.name || cat.code || 'Unnamed Category',
  }));

  // Prepare branch options with proper IDs
  const branchOptions = branches.map((branch) => {
    // Handle both direct IDs and branch Objects
    const branchId = typeof branch === 'string' ? branch : branch._id || branch.id;
    const branchLabel = typeof branch === 'string' ? branch : branch.name || branch.branchName || branch._id;
    return {
      value: branchId,
      label: branchLabel,
    };
  });

  const itemOptions = assetTypes.map((item) => ({
    value: item._id, // Store the ObjectId as value
    label: item.name || item._id,
    _id: item._id, // Keep _id for reference
  }));

  const handleFormChange = (name, value) => {
    // Special handling for branch field - store both branch (display) and branchId (DB)
    if (name === 'branch') {
      setFormData((prev) => ({
        ...prev,
        branch: value,
        branchId: value, // Store ID as branchId for API
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for this field when user fills it (after validation has run)
    if (errors[name] && value && String(value).trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // ========== AUTO-CALCULATE TOTAL AMOUNT ==========
  useEffect(() => {
    const total = calculateTotalAmount(formData.purchaseCost, formData.taxAmount);
    if (total !== null && formData.totalAmount !== total) {
      setFormData((prev) => ({ ...prev, totalAmount: total }));
    }
  }, [formData.purchaseCost, formData.taxAmount]);

  // ========== AUTO-FILL WARRANTY START DATE FROM PURCHASE ==========
  useEffect(() => {
    const warrantyStartDate = getWarrantyStartDateFromPurchase(formData);
    if (warrantyStartDate && !formData.warrantyStartDate) {
      setFormData((prev) => ({ ...prev, warrantyStartDate }));
    }
  }, [formData.assetReceivedOn, formData.invoiceDate, formData.deliveryChallanDate]);

  // ========== AUTO-CALCULATE WARRANTY END DATE FOR DURATION MODE ==========
  useEffect(() => {
    const warrantyMode = String(formData.warrantyMode || "").toLowerCase();
    
    if (warrantyMode === "duration" && formData.warrantyStartDate) {
      const warrantyEndDate = calculateWarrantyEndDateFromDuration(
        formData.warrantyStartDate,
        formData.inYear,
        formData.inMonth
      );
      if (warrantyEndDate && formData.warrantyEndDate !== warrantyEndDate) {
        setFormData((prev) => ({ ...prev, warrantyEndDate }));
      }
    }
  }, [formData.warrantyMode, formData.warrantyStartDate, formData.inYear, formData.inMonth]);

  // ========== CALCULATE WARRANTY STATUS ==========
  useEffect(() => {
    const warrantyStatus = calculateWarrantyStatus(formData.warrantyEndDate);
    if (warrantyStatus && formData.warrantyStatus !== warrantyStatus) {
      setFormData((prev) => ({ ...prev, warrantyStatus }));
    }
  }, [formData.warrantyEndDate]);

  // ========== ENFORCE WARRANTY / AMC RULES ==========
  useEffect(() => {
    const warrantyAvailable = String(formData.warrantyAvailable || "").toLowerCase();
    if (warrantyAvailable === "yes") {
      // If warranty is active, AMC must be disabled
      if (formData.amcAvailable !== "No") {
        setFormData((prev) => ({
          ...prev,
          amcAvailable: "No",
          amcVendor: null,
          amcStartDate: null,
          amcEndDate: null,
        }));
      }
    }
  }, [formData.warrantyAvailable]);

  // Calculate validation errors for red border display
  const calculateValidationErrors = () => {
    const validationErrors = {};
    sections.forEach((section) => {
      if (!Array.isArray(section.fields)) return;
      section.fields.forEach((field) => {
        if (field.required) {
          const value = formData?.[field.name];
          if (!value || String(value).trim() === '') {
            validationErrors[field.name] = `${field.label} is required`;
          }
        }
      });
    });

    // Add purchase-specific validations
    const purchaseErrors = validatePurchaseFields(formData);
    purchaseErrors.forEach((msg) => {
      validationErrors[`purchase_${msg}`] = msg;
    });

    // Add warranty-specific validations
    const warrantyErrors = validateWarrantyFields(formData);
    warrantyErrors.forEach((msg) => {
      validationErrors[`warranty_${msg}`] = msg;
    });

    return validationErrors;
  };


  const handleItemSelect = async (e) => {
    const selectedId = e.target.value;
    const selectedAssetObj = assetTypes.find(item => item._id === selectedId);
    
    if (selectedAssetObj) {
      const normalizedName = normalizeTypeKey(selectedAssetObj.name || selectedAssetObj._id);
      setSelectedAsset(normalizedName); // normalized name for config lookup
      setSelectedAssetId(selectedId); // ObjectId for data persistence

      // Fetch next asset tag for the selected asset type
      try {
        const nextAssetTag = await getNextAssetTag(selectedId);
        setFormData((prev) => ({
          ...prev,
          assetTag: nextAssetTag,
        }));
      } catch (error) {
        console.error('Failed to load next asset tag:', error);
        setFormData((prev) => ({
          ...prev,
          assetTag: 'Enter asset code',
        }));
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Validate required fields
      if (!selectedAsset || !selectedCategory) {
        setErrorMessage('Please select both category and item type');
        setSubmitting(false);
        return;
      }

      // Validate that branch is selected
      if (!formData.branch && !formData.branchId) {
        setErrorMessage('Please select a branch');
        setSubmitting(false);
        return;
      }

      // Check all required fields marked with * (required: true)
      const validationErrors = calculateValidationErrors();
      if (Object.keys(validationErrors).length > 0) {
        // Get field labels for alert
        const emptyFieldLabels = Object.values(validationErrors).map(msg => msg.replace(' is required', ''));
        
        // Show alert to user
        alert(`Please fill all required fields:\n${emptyFieldLabels.join('\n')}`);
        
        // Set errors to show red borders on empty required fields
        setErrors(validationErrors);
        
        setSubmitting(false);
        return;
      }

      // All validations passed - prepare payload
      const { assetcategory: _ignored, ...filteredFormData } = formData;
      const payload = {
        assetType: selectedAsset, // normalized name for backend handler routing
        assetTypeId: selectedAssetId, // ObjectId for proper M2M relationship
        assetCategory: selectedCategory, // ObjectId reference to asset category
        branchId: filteredFormData.branchId || filteredFormData.branch, // Include branch ObjectId
        ...filteredFormData,
      };

      // Ensure totalAmount is derived from purchaseCost + taxAmount at submit time
      payload.totalAmount = calculateTotalAmount(payload.purchaseCost, payload.taxAmount);

      // Log payload to console for debugging
      // console.log('[SEND] Sending payload to backend:', payload);

      // Call createAsset API
      const result = await createAsset(payload);

      // Success
      setSuccessMessage(`Asset created successfully! ID: ${result._id}`);
      
      // Reset form after 1.5 seconds and navigate back
      setTimeout(() => {
        handleCancel();
        navigate('/assets');
      }, 1500);
    } catch (err) {
      const errorMsg = err.message || 'Failed to save asset. Please try again.';
      setErrorMessage(errorMsg);
      console.error('Asset creation failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    // Reset form but keep branch if it was auto-assigned
    const resetData = { assetcategory: selectedCategoryName, assetType: selectedAsset };
    if (isBranchFieldDisabled && userSelectedBranch) {
      resetData.branch = userSelectedBranch;
      resetData.branchId = userSelectedBranch;
    }
    setFormData(resetData);
    setErrors({});
  };

  const handleCancel = () => {
    setSelectedCategory('');
    setSelectedAsset('');
    setSections([]);
    // Reset but preserve branch if it was auto-assigned
    const cancelData = {};
    if (isBranchFieldDisabled && userSelectedBranch) {
      cancelData.branch = userSelectedBranch;
      cancelData.branchId = userSelectedBranch;
    }
    setFormData(cancelData);
    setErrors({});
  };

  if (initialLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#666', fontSize: '1rem' }}>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="add-item-page">
      {/* Show branch info if auto-assigned */}
      {/* {isBranchFieldDisabled && userSelectedBranch && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          backgroundColor: '#e3f2fd',
          color: '#1565c0',
          borderRadius: '6px',
          border: '1px solid #90caf9',
          fontSize: '0.9rem',
        }}>
          <strong>Branch Assigned:</strong> Item will be added to your selected branch. Branch field is locked.
        </div>
      )} */}
      <div className="add-item-container">
        {successMessage && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '6px',
            border: '1px solid #c3e6cb',
            fontSize: '0.95rem',
            wordBreak: 'break-word',
          }}>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '6px',
            border: '1px solid #f5c6cb',
            fontSize: '0.95rem',
            wordBreak: 'break-word',
          }}>
            {errorMessage}
          </div>
        )}
        <div className="add-item-form">
          <h1 className="add-item-title">Add New Item</h1>
          <div className="asset-form-row">
            <Select
              name="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categoryOptions}
              placeholder="Select a category"
              required
            />
            <Select
              name="item"
              value={selectedAssetId}
              onChange={handleItemSelect}
              options={itemOptions}
              placeholder={selectedCategory ? 'Select an item': 'Select a category first'}
              required
              disabled={!selectedCategory}
            />
          </div>
        </div>

        {sections.length > 0 ? (
          <div className="add-item-form-renderer">
            <FormRenderer
              sections={sections}
              formData={formData}
              errors={errors}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              onReset={handleReset}
              onCancel={handleCancel}
              submitting={submitting}
              branchOptions={branchOptions}
              isBranchFieldDisabled={isBranchFieldDisabled}
              userSelectedBranch={userSelectedBranch}
            />
          </div>
        ) : selectedAsset ? (
          <div className="form-empty-notice">No form configuration found for selected item.</div>
        ) : null}
      </div>
    </div>
  );
};

export default AddAsset;

