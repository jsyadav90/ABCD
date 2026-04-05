import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { createOrUpdateAssetTagCounterConfig, getAssetTagCounterConfig, getNextAssetTag, listAssetTagCounterConfigs } from "../services/assetTagGenerator.service.js";

export const createAssetTagConfig = asyncHandler(async (req, res) => {
  const { categoryId, assetCategory, assetTypeId, assetType, prefix, sequence, isActive } = req.body;
  const resolvedAssetTypeId = assetTypeId || assetType;
  const resolvedCategoryId = categoryId || assetCategory;

  if (!resolvedAssetTypeId || !String(resolvedAssetTypeId).trim()) {
    return res.status(400).json(new apiResponse(400, null, "assetTypeId is required"));
  }
  if (!prefix || !String(prefix).trim()) {
    return res.status(400).json(new apiResponse(400, null, "prefix is required"));
  }

  const config = await createOrUpdateAssetTagCounterConfig({
    assetTypeId: resolvedAssetTypeId,
    categoryId: resolvedCategoryId,
    prefix,
    sequence,
    isActive,
    isCreate: true, // Include isCreate flag for duplicate check
  });

  return res.status(201).json(new apiResponse(201, config, "Asset tag configuration created successfully"));
});

export const getAssetTagConfig = asyncHandler(async (req, res) => {
  const { assetTypeId } = req.params;
  const config = await getAssetTagCounterConfig(assetTypeId);
  return res.status(200).json(new apiResponse(200, config, "Asset tag configuration retrieved"));
});

export const previewNextAssetTag = asyncHandler(async (req, res) => {
  const { assetTypeId } = req.params;
  const nextTag = await getNextAssetTag(assetTypeId);
  return res.status(200).json(new apiResponse(200, { nextAssetTag: nextTag }, "Next asset tag retrieved"));
});

export const listAssetTagConfigs = asyncHandler(async (req, res) => {
  const configs = await listAssetTagCounterConfigs();
  return res.status(200).json(new apiResponse(200, { items: configs }, "Asset tag configurations retrieved"));
});
