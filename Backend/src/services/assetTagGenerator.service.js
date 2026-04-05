import mongoose from "mongoose";
import { AssetTagCounter } from "../models/assetTagCounter.model.js";
import { AssetType } from "../models/assettype.model.js";
import { apiError } from "../utils/apiError.js";

const formatAssetTag = (prefix, sequence) => {
  return `${String(prefix).trim().toUpperCase()}-${String(sequence).padStart(3, "0")}`;
};

export const createOrUpdateAssetTagCounterConfig = async ({ assetTypeId, categoryId, prefix, sequence = 0, isActive = true, isCreate = false }) => {
  if (!mongoose.Types.ObjectId.isValid(assetTypeId)) {
    throw new apiError(400, "Invalid assetTypeId");
  }

  if (!prefix || !String(prefix).trim()) {
    throw new apiError(400, "prefix is required");
  }

  const assetType = await AssetType.findOne({ _id: assetTypeId, isDeleted: false });
  if (!assetType) {
    throw new apiError(404, "AssetType not found");
  }

  if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new apiError(400, "Invalid categoryId");
  }
  if (categoryId && String(assetType.category) !== String(categoryId)) {
    throw new apiError(400, "AssetType does not belong to the provided category");
  }

  // Check if document already exists
  const existingCounter = await AssetTagCounter.findById(`assetTag_${assetTypeId}`);
  
  // If trying to create and document already exists, throw duplicate error
  if (isCreate && existingCounter) {
    throw new apiError(409, `Asset tag configuration already exists for this asset type. Duplicate entry not allowed.`);
  }

  const updated = await AssetTagCounter.findOneAndUpdate(
    { _id: `assetTag_${assetTypeId}` },
    {
      $set: {
        prefix: String(prefix).trim().toUpperCase(),
        sequence: Number(sequence) || 0,
        assetType: assetTypeId,
        category: categoryId || assetType.category,
        isActive: Boolean(isActive),
      },
    },
    { new: true, upsert: !isCreate, setDefaultsOnInsert: true }
  );

  return updated;
};

export const getAssetTagCounterConfig = async (assetTypeId) => {
  if (!mongoose.Types.ObjectId.isValid(assetTypeId)) {
    throw new apiError(400, "Invalid assetTypeId");
  }

  const counter = await AssetTagCounter.findById(`assetTag_${assetTypeId}`).populate("assetType", "name category").populate("category", "name");
  if (!counter) {
    throw new apiError(404, "Asset tag configuration not found");
  }

  return counter;
};

export const getNextAssetTag = async (assetTypeId) => {
  if (!mongoose.Types.ObjectId.isValid(assetTypeId)) {
    throw new apiError(400, "Invalid assetTypeId");
  }

  const counter = await AssetTagCounter.findById(`assetTag_${assetTypeId}`);
  if (!counter || !counter.isActive) {
    throw new apiError(404, "Asset tag configuration not found or inactive");
  }

  return formatAssetTag(counter.prefix, (counter.sequence || 0) + 1);
};

export const generateAssetTag = async (assetTypeId) => {
  if (!mongoose.Types.ObjectId.isValid(assetTypeId)) {
    throw new apiError(400, "Invalid assetTypeId");
  }

  const counter = await AssetTagCounter.findOneAndUpdate(
    { _id: `assetTag_${assetTypeId}`, isActive: true },
    { $inc: { sequence: 1 } },
    { new: true }
  );

  if (!counter) {
    throw new apiError(404, "Asset tag config not found. Please configure first.");
  }

  return formatAssetTag(counter.prefix, counter.sequence);
};

export const listAssetTagCounterConfigs = async () => {
  return await AssetTagCounter.find({}).sort({ createdAt: -1 });
};
