/**
 * asset type Controller
 * Description: CRUD operations for asset types (CPU, Monitor, Laptop, etc.)
 */
import { AssetType } from "../models/assettype.model.js";
import { AssetCategory } from "../models/assetcategory.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

/**
 * CREATE: asset type
 * POST /api/v1/assettypes
 */
export const createAssetType = asyncHandler(async (req, res) => {
  const { name, category, description } = req.body;

  // Validation
  if (!name || !String(name).trim()) {
    throw new apiError(400, "asset type name is required");
  }
  if (!category || !String(category).trim()) {
    throw new apiError(400, "Category ID is required");
  }

  // Check if category exists
  const categoryExists = await AssetCategory.findOne({
    _id: category,
    isDeleted: false,
    isActive: true,
  });

  if (!categoryExists) {
    throw new apiError(400, "Invalid category ID");
  }

  // Check duplicate name in same category
  const existing = await AssetType.findOne({
    name: { $regex: `^${name.trim()}$`, $options: "i" },
    category: category,
    isDeleted: false,
  });

  if (existing) {
    throw new apiError(400, "asset type with this name already exists in the selected category");
  }

  const newAssetType = await AssetType.create({
    name: name.trim(),
    category: category,
    description: description ? description.trim() : null,
  });

  // Populate category for response
  await newAssetType.populate('category', 'name');

  return res
    .status(201)
    .json(new apiResponse(201, newAssetType, "asset type created successfully"));
});

/**
 * GET ALL: asset types
 * GET /api/v1/assettypes
 */
export const getAllAssetTypes = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const category = req.query.category;
  const isActive = req.query.isActive;

  const skip = (page - 1) * limit;

  // Build filter
  const filter = { isDeleted: false };
  if (category) {
    filter.category = category;
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  // Fetch data with pagination and populate category
  const assetTypes = await AssetType.find(filter)
    .populate('category', 'name code')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });

  // Total count
  const total = await AssetType.countDocuments(filter);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { items: assetTypes, meta: { page, limit, total } },
        "asset types retrieved successfully"
      )
    );
});

/**
 * GET BY ID: asset type
 * GET /api/v1/assettypes/:id
 */
export const getAssetTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const foundAssetType = await AssetType.findOne({
    _id: id,
    isDeleted: false,
  }).populate('category', 'name code');

  if (!foundAssetType) {
    throw new apiError(404, "asset type not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, foundAssetType, "asset type retrieved successfully"));
});

/**
 * UPDATE: asset type
 * PUT /api/v1/assettypes/:id
 */
export const updateAssetType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, description, isActive } = req.body;

  const assetTypeToUpdate = await AssetType.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!assetTypeToUpdate) {
    throw new apiError(404, "asset type not found");
  }

  // Check category if being updated
  if (category && category !== assetTypeToUpdate.category.toString()) {
    const categoryExists = await AssetCategory.findOne({
      _id: category,
      isDeleted: false,
      isActive: true,
    });

    if (!categoryExists) {
      throw new apiError(400, "Invalid category ID");
    }

    // Check duplicate name in new category
    if (name && String(name).trim()) {
      const existing = await AssetType.findOne({
        _id: { $ne: id },
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        category: category,
        isDeleted: false,
      });

      if (existing) {
        throw new apiError(400, "asset type with this name already exists in the selected category");
      }
    }

    assetTypeToUpdate.category = category;
  }

  // Check duplicate name in same category if name is changing
  if (name && String(name).trim() && name.trim() !== assetTypeToUpdate.name) {
    const existing = await AssetType.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name.trim()}$`, $options: "i" },
      category: assetTypeToUpdate.category,
      isDeleted: false,
    });

    if (existing) {
      throw new apiError(400, "asset type with this name already exists in the selected category");
    }

    assetTypeToUpdate.name = name.trim();
  }

  // Update other fields
  if (description !== undefined) {
    assetTypeToUpdate.description = description ? description.trim() : null;
  }
  if (isActive !== undefined) {
    assetTypeToUpdate.isActive = isActive;
  }

  await assetTypeToUpdate.save();
  await assetTypeToUpdate.populate('category', 'name code');

  return res
    .status(200)
    .json(new apiResponse(200, assetTypeToUpdate, "asset type updated successfully"));
});

/**
 * DELETE: asset type (Soft Delete)
 * DELETE /api/v1/assettypes/:id
 */
export const deleteAssetType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assetTypeToDelete = await AssetType.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!assetTypeToDelete) {
    throw new apiError(404, "asset type not found");
  }

  assetTypeToDelete.isDeleted = true;
  await assetTypeToDelete.save();

  return res
    .status(200)
    .json(new apiResponse(200, null, "asset type deleted successfully"));
});

/**
 * GET BY CATEGORY: Get asset types for a specific category
 * GET /api/v1/assettypes/category/:categoryId
 */
export const getAssetTypesByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  // Verify category exists
  const category = await AssetCategory.findOne({
    _id: categoryId,
    isDeleted: false,
    isActive: true,
  });

  if (!category) {
    throw new apiError(404, "Category not found");
  }

  const assetTypes = await AssetType.find({
    category: categoryId,
    isDeleted: false,
    isActive: true,
  }).sort({ name: 1 });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { items: assetTypes, category: category },
        "asset types retrieved successfully"
      )
    );
});


