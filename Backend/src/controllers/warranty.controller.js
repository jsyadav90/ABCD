import mongoose from "mongoose";
import { Warranty } from "../models/warranty.model.js";
import { Purchase } from "../models/purchase.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { norm, toNumberOrNull } from "../utils/assetUtils.js";

const lc = (v) => norm(v).toLowerCase();

const parseDate = (value) => {
  if (value == null || String(value).trim() === "") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const validateWarranty = (payload) => {
  const errors = [];
  const warrantyAvailable = lc(payload.warrantyAvailable);
  const warrantyMode = lc(payload.warrantyMode);
  const amcAvailable = lc(payload.amcAvailable);

  if (warrantyAvailable !== "yes" && warrantyAvailable !== "no") {
    errors.push("warrantyAvailable must be Yes or No");
  }

  if (warrantyAvailable === "yes") {
    if (!payload.warrantyMode) {
      errors.push("warrantyMode is required when warrantyAvailable is Yes");
    }

    if (warrantyMode === "duration") {
      if (payload.inYear == null || payload.inYear < 0) {
        errors.push("inYear is required and must be zero or positive when warrantyMode is Duration");
      }
      if (payload.inMonth == null || payload.inMonth < 0) {
        errors.push("inMonth is required and must be zero or positive when warrantyMode is Duration");
      }
      if (!payload.warrantyStartDate) {
        errors.push("warrantyStartDate is required for duration-based warranties");
      }
    }

    if (warrantyMode === "enddate") {
      if (!payload.warrantyStartDate) {
        errors.push("warrantyStartDate is required when warrantyMode is EndDate");
      }
      if (!payload.warrantyEndDate) {
        errors.push("warrantyEndDate is required when warrantyMode is EndDate");
      }
      if (payload.warrantyStartDate && payload.warrantyEndDate) {
        const start = new Date(payload.warrantyStartDate);
        const end = new Date(payload.warrantyEndDate);
        if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end <= start) {
          errors.push("warrantyEndDate must be greater than warrantyStartDate");
        }
      }
    }
  }

  if (warrantyAvailable === "no") {
    if (amcAvailable === "yes") {
      if (!payload.amcVendor) {
        errors.push("amcVendor is required when amcAvailable is Yes and warranty is not available");
      }
      if (!payload.amcStartDate) {
        errors.push("amcStartDate is required when amcAvailable is Yes and warranty is not available");
      }
      if (!payload.amcEndDate) {
        errors.push("amcEndDate is required when amcAvailable is Yes and warranty is not available");
      }
      if (payload.amcStartDate && payload.amcEndDate) {
        const start = new Date(payload.amcStartDate);
        const end = new Date(payload.amcEndDate);
        if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end <= start) {
          errors.push("amcEndDate must be greater than amcStartDate");
        }
      }
    }
  }

  return errors;
};

const calculateWarrantyEndDate = (startDate, inYear, inMonth) => {
  if (!startDate) return null;
  const date = new Date(startDate);
  const years = Number.isFinite(inYear) ? inYear : 0;
  const months = Number.isFinite(inMonth) ? inMonth : 0;
  date.setMonth(date.getMonth() + months);
  date.setFullYear(date.getFullYear() + years);
  return Number.isFinite(date.getTime()) ? date : null;
};

const calculateWarrantyStatus = (doc) => {
  if (!doc || lc(doc.warrantyAvailable) !== "yes") return null;
  if (!doc.warrantyEndDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(doc.warrantyEndDate);
  endDate.setHours(0, 0, 0, 0);
  return today > endDate ? "Expired" : "Under Warranty";
};

const normalizeWarranty = async (raw, assetId, orgId) => {
  const out = { ...raw };
  out.warrantyAvailable = lc(out.warrantyAvailable) === "yes" ? "Yes" : "No";
  out.amcAvailable = lc(out.amcAvailable) === "yes" ? "Yes" : "No";
  out.warrantyMode = norm(out.warrantyMode) || null;

  out.inYear = toNumberOrNull(out.inYear);
  out.inMonth = toNumberOrNull(out.inMonth);
  out.warrantyStartDate = parseDate(out.warrantyStartDate);
  out.warrantyEndDate = parseDate(out.warrantyEndDate);
  out.amcStartDate = parseDate(out.amcStartDate);
  out.amcEndDate = parseDate(out.amcEndDate);

  const purchase = await Purchase.findOne({ assetId, organizationId: orgId, isDeleted: false }).lean();
  if (purchase && purchase.assetReceivedOn) {
    const receivedOn = lc(purchase.assetReceivedOn);
    if (receivedOn === "invoice" && purchase.invoiceDate) {
      out.warrantyStartDate = parseDate(purchase.invoiceDate);
    }
    if (receivedOn === "challan" && purchase.deliveryChallanDate) {
      out.warrantyStartDate = parseDate(purchase.deliveryChallanDate);
    }
  }

  if (lc(out.warrantyAvailable) === "yes") {
    out.amcAvailable = "No";
    out.amcVendor = null;
    out.amcStartDate = null;
    out.amcEndDate = null;

    const mode = lc(out.warrantyMode);
    if (mode === "duration") {
      out.warrantyEndDate = calculateWarrantyEndDate(out.warrantyStartDate, out.inYear, out.inMonth);
    }

    if (mode !== "enddate" && mode !== "duration") {
      out.warrantyStartDate = null;
      out.warrantyEndDate = null;
      out.inYear = null;
      out.inMonth = null;
    }

    const provider = lc(out.warrantyProvider);
    if (provider !== "extended") {
      out.supportVendor = null;
      out.supportPhone = null;
      out.supportEmail = null;
    }

    out.warrantyTillDate = out.warrantyEndDate ? new Date(out.warrantyEndDate) : null;
  } else {
    out.warrantyMode = null;
    out.inYear = null;
    out.inMonth = null;
    out.warrantyStartDate = null;
    out.warrantyEndDate = null;
    out.warrantyProvider = null;
    out.supportVendor = null;
    out.supportPhone = null;
    out.supportEmail = null;
    out.warrantyTillDate = null;

    if (lc(out.amcAvailable) !== "yes") {
      out.amcVendor = null;
      out.amcStartDate = null;
      out.amcEndDate = null;
    }
  }

  return out;
};

export const upsertWarrantyByAsset = asyncHandler(async (req, res) => {
  const assetId = req.params.assetId;
  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    throw new apiError(400, "Invalid assetId");
  }

  const orgId = req.user?.organizationId || null;
  if (!orgId) {
    throw new apiError(400, "organizationId missing in user context");
  }

  const base = await normalizeWarranty(req.body || {}, assetId, orgId);
  const validationErrors = validateWarranty(base);
  if (validationErrors.length > 0) {
    throw new apiError(400, validationErrors.join("; "));
  }

  const filter = { assetId, organizationId: orgId, isDeleted: false };
  const update = {
    ...base,
    assetId,
    organizationId: orgId,
    branchId: base.branchId || base.branch || null,
    AssetCategory: base.AssetCategory || undefined,
    AssetType: base.AssetType ? lc(base.AssetType) : undefined,
    updatedBy: req.user?._id || req.user?.id,
  };
  if (!update.createdBy) update.createdBy = req.user?._id || req.user?.id;

  const doc = await Warranty.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  }).lean();

  const result = doc ? { ...doc, warrantyStatus: calculateWarrantyStatus(doc) } : null;
  return res.status(200).json(new apiResponse(200, result, "Warranty saved"));
});

export const getWarrantyByAsset = asyncHandler(async (req, res) => {
  const assetId = req.params.assetId;
  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    throw new apiError(400, "Invalid assetId");
  }

  const orgId = req.user?.organizationId || null;
  const filter = { assetId, isDeleted: false };
  if (orgId) filter.organizationId = orgId;

  const doc = await Warranty.findOne(filter).lean();
  const result = doc ? { ...doc, warrantyStatus: calculateWarrantyStatus(doc) } : null;
  return res.status(200).json(new apiResponse(200, result, "Warranty fetched"));
});


