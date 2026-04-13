import mongoose from "mongoose";
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

const calcTotalAmount = (purchaseCost, taxAmount) => {
  if (purchaseCost == null && taxAmount == null) return null;
  const cost = Number.isFinite(purchaseCost) ? purchaseCost : 0;
  const tax = Number.isFinite(taxAmount) ? taxAmount : 0;
  return cost + tax;
};

const normalizePurchase = (raw) => {
  const out = { ...raw };
  out.purchaseType = norm(out.purchaseType) || null;
  out.assetReceivedOn = norm(out.assetReceivedOn) || null;

  out.poNumber = norm(out.poNumber) || null;
  out.receiptNumber = norm(out.receiptNumber) || null;
  out.invoiceNumber = norm(out.invoiceNumber) || null;
  out.deliveryChallanNumber = norm(out.deliveryChallanNumber) || null;

  out.purchaseCost = toNumberOrNull(out.purchaseCost);
  out.taxAmount = toNumberOrNull(out.taxAmount);
  out.purchaseDate = parseDate(out.purchaseDate);
  out.poDate = parseDate(out.poDate);
  out.receiptDate = parseDate(out.receiptDate);
  out.invoiceDate = parseDate(out.invoiceDate);
  out.deliveryChallanDate = parseDate(out.deliveryChallanDate);

  if (lc(out.purchaseType) === "po") {
    out.receiptNumber = null;
    out.receiptDate = null;
  } else if (lc(out.purchaseType) === "direct") {
    out.poNumber = null;
    out.poDate = null;
  } else {
    out.poNumber = null;
    out.poDate = null;
    out.receiptNumber = null;
    out.receiptDate = null;
  }

  if (lc(out.assetReceivedOn) === "invoice") {
    out.deliveryChallanNumber = null;
    out.deliveryChallanDate = null;
    out.purchaseDate = out.invoiceDate;
  } else if (lc(out.assetReceivedOn) === "challan") {
    out.invoiceNumber = null;
    out.invoiceDate = null;
    out.purchaseDate = out.deliveryChallanDate;
  } else {
    out.invoiceNumber = null;
    out.invoiceDate = null;
    out.deliveryChallanNumber = null;
    out.deliveryChallanDate = null;
  }

  if (out.taxAmount == null) out.taxAmount = 0;
  out.totalAmount = calcTotalAmount(out.purchaseCost, out.taxAmount);

  return out;
};

const validatePurchase = (payload) => {
  const errors = [];
  const purchaseType = lc(payload.purchaseType);
  const assetReceivedOn = lc(payload.assetReceivedOn);

  if (!payload.purchaseType) {
    errors.push("purchaseType is required");
  } else if (!["po", "direct"].includes(purchaseType)) {
    errors.push("purchaseType must be PO or Direct");
  }

  if (purchaseType === "po") {
    if (!payload.poNumber) errors.push("poNumber is required when purchaseType is PO");
    if (!payload.poDate) errors.push("poDate is required when purchaseType is PO");
  }

  if (purchaseType === "direct") {
    if (!payload.receiptNumber) errors.push("receiptNumber is required when purchaseType is Direct");
    if (!payload.receiptDate) errors.push("receiptDate is required when purchaseType is Direct");
  }

  if (!payload.assetReceivedOn) {
    errors.push("assetReceivedOn is required");
  } else if (!["invoice", "challan"].includes(assetReceivedOn)) {
    errors.push("assetReceivedOn must be invoice or challan");
  }

  if (assetReceivedOn === "invoice") {
    if (!payload.invoiceNumber) errors.push("invoiceNumber is required when assetReceivedOn is invoice");
    if (!payload.invoiceDate) errors.push("invoiceDate is required when assetReceivedOn is invoice");
  }

  if (assetReceivedOn === "challan") {
    if (!payload.deliveryChallanNumber) errors.push("deliveryChallanNumber is required when assetReceivedOn is challan");
    if (!payload.deliveryChallanDate) errors.push("deliveryChallanDate is required when assetReceivedOn is challan");
  }

  if (payload.purchaseCost == null || payload.purchaseCost < 0) {
    errors.push("purchaseCost is required and must be a non-negative number");
  }

  if (payload.taxAmount != null && payload.taxAmount < 0) {
    errors.push("taxAmount must be a non-negative number");
  }

  return errors;
};

export const upsertPurchaseByAsset = asyncHandler(async (req, res) => {
  const assetId = req.params.assetId;
  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    throw new apiError(400, "Invalid assetId");
  }

  const base = normalizePurchase(req.body || {});
  const validationErrors = validatePurchase(base);
  if (validationErrors.length > 0) {
    throw new apiError(400, validationErrors.join("; "));
  }

  const orgId = req.user?.organizationId || null;
  if (!orgId) {
    throw new apiError(400, "organizationId missing in user context");
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

  const doc = await Purchase.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  }).lean();

  return res.status(200).json(new apiResponse(200, doc, "Purchase saved"));
});

export const getPurchaseByAsset = asyncHandler(async (req, res) => {
  const assetId = req.params.assetId;
  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    throw new apiError(400, "Invalid assetId");
  }

  const orgId = req.user?.organizationId || null;
  const filter = { assetId, isDeleted: false };
  if (orgId) filter.organizationId = orgId;

  const doc = await Purchase.findOne(filter).lean();
  return res.status(200).json(new apiResponse(200, doc || null, "Purchase fetched"));
});


