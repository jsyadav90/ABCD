/**
 * Frontend Purchase & Warranty Calculation Utility
 * Real-time calculations for form auto-fill and validations
 */

// ========== PURCHASE CALCULATIONS ==========

/**
 * Parse a date-only string safely as local date
 * @param {string|Date} date
 * @returns {Date|null}
 */
const parseDateString = (date) => {
  if (!date) return null;
  if (date instanceof Date && !isNaN(date.getTime())) return date;
  const str = String(date).trim();

  const isoMatch = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (isoMatch) {
    const parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  const dmyMatch = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmyMatch) {
    const parsed = new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  const parsed = new Date(str);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

/**
 * Format date to YYYY-MM-DD string
 */
const formatDate = (date) => {
  const d = parseDateString(date);
  if (!d) return null;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

/**
 * Calculate total amount from purchase cost and tax
 * @param {number|string} purchaseCost
 * @param {number|string} taxAmount
 * @returns {number|null}
 */
export const calculateTotalAmount = (purchaseCost, taxAmount) => {
  const cost = Number(purchaseCost) || 0;
  const tax = Number(taxAmount) || 0;
  if (cost === 0 && tax === 0) return null;
  return cost + tax;
};

/**
 * Get warranty start date from purchase receipt date
 * @param {Object} formData - form data object
 * @returns {string|null} warranty start date (YYYY-MM-DD) or null
 */
export const getWarrantyStartDateFromPurchase = (formData) => {
  const assetReceivedOn = String(formData.assetReceivedOn || "").toLowerCase();
  
  if (assetReceivedOn === "invoice" && formData.invoiceDate) {
    return formatDate(formData.invoiceDate);
  }
  if (assetReceivedOn === "challan" && formData.deliveryChallanDate) {
    return formatDate(formData.deliveryChallanDate);
  }
  return null;
};

// ========== WARRANTY CALCULATIONS ==========

/**
 * Calculate warranty end date based on start date and duration
 * @param {string} startDate - warranty start date (YYYY-MM-DD format)
 * @param {number} inYear - years of warranty
 * @param {number} inMonth - months of warranty
 * @returns {string|null} warranty end date (YYYY-MM-DD) or null
 */
export const calculateWarrantyEndDateFromDuration = (startDate, inYear, inMonth) => {
  if (!startDate) return null;
  
  const years = Number(inYear) || 0;
  const months = Number(inMonth) || 0;
  
  try {
    const date = parseDateString(startDate);
    if (!date) return null;
    
    date.setFullYear(date.getFullYear() + years);
    date.setMonth(date.getMonth() + months);
    
    return formatDate(date);
  } catch (e) {
    console.error("Error calculating warranty end date:", e);
    return null;
  }
};

/**
 * Calculate warranty status based on warranty end date
 * Industrial Standard: If today > warrantyEndDate, warranty is expired
 * @param {string} warrantyEndDate - warranty end date (YYYY-MM-DD format)
 * @returns {string|null} "Active" or "Expired" or null
 */
export const calculateWarrantyStatus = (warrantyEndDate) => {
  if (!warrantyEndDate) return null;

  try {
    const endDate = parseDateString(warrantyEndDate);
    if (!endDate) return null;

    const today = new Date();

    // Set time to start of day for accurate comparison
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // If today is after warranty end date, warranty is expired
    if (today > endDate) {
      return "Expired";
    }

    // Otherwise warranty is still active
    return "Active";
  } catch (e) {
    console.error("Error calculating warranty status:", e);
    return null;
  }
};

// ========== VALIDATION HELPERS ==========

/**
 * Validate warranty-related fields
 * @param {Object} formData - form data object
 * @returns {Array} array of validation error messages
 */
export const validateWarrantyFields = (formData) => {
  const errors = [];
  const warrantyAvailable = String(formData.warrantyAvailable || "").toLowerCase();
  const warrantyMode = String(formData.warrantyMode || "").toLowerCase();

  if (warrantyAvailable === "yes") {
    if (!formData.warrantyStartDate) {
      errors.push("warranty start date is required");
    }

    if (warrantyMode === "duration") {
      const inYear = Number(formData.inYear) || 0;
      const inMonth = Number(formData.inMonth) || 0;
      if (inYear === 0 && inMonth === 0) {
        errors.push("warranty duration must be at least 1 month");
      }
    }

    if (warrantyMode === "enddate") {
      if (!formData.warrantyEndDate) {
        errors.push("warranty end date is required");
      }
      if (formData.warrantyStartDate && formData.warrantyEndDate) {
        const start = parseDateString(formData.warrantyStartDate);
        const end = parseDateString(formData.warrantyEndDate);
        if (start && end && end <= start) {
          errors.push("warranty end date must be after start date");
        }
      }
    }
  }

  return errors;
};

/**
 * Validate purchase-related fields
 * @param {Object} formData - form data object
 * @returns {Array} array of validation error messages
 */
export const validatePurchaseFields = (formData) => {
  const errors = [];
  const purchaseType = String(formData.purchaseType || "").toLowerCase();
  const assetReceivedOn = String(formData.assetReceivedOn || "").toLowerCase();

  if (purchaseType === "po") {
    if (!formData.poNumber) errors.push("PO number is required");
    if (!formData.poDate) errors.push("PO date is required");
  } else if (purchaseType === "direct") {
    if (!formData.receiptNumber) errors.push("receipt number is required");
    if (!formData.receiptDate) errors.push("receipt date is required");
  }

  if (assetReceivedOn === "invoice") {
    if (!formData.invoiceNumber) errors.push("invoice number is required");
    if (!formData.invoiceDate) errors.push("invoice date is required");
  } else if (assetReceivedOn === "challan") {
    if (!formData.deliveryChallanNumber) errors.push("delivery challan number is required");
    if (!formData.deliveryChallanDate) errors.push("delivery challan date is required");
  }

  const purchaseCost = Number(formData.purchaseCost);
  if (!Number.isFinite(purchaseCost) || purchaseCost <= 0) {
    errors.push("purchase cost must be greater than 0");
  }

  const taxAmount = Number(formData.taxAmount) || 0;
  if (taxAmount < 0) {
    errors.push("tax amount cannot be negative");
  }

  return errors;
};

