/**
 * Item Type Controller
 * Description: CRUD operations for item types (CPU, Monitor, Laptop, etc.)
 */
import { ItemType } from "../models/itemtype.model.js";
import { AssetCategory } from "../models/assetcategory.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

/**
 * CREATE: Item Type
 * POST /api/v1/itemtypes
 */
export const createItemType = asyncHandler(async (req, res) => {
  const { name, category, description } = req.body;

  // Validation
  if (!name || !String(name).trim()) {
    throw new apiError(400, "Item type name is required");
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
  const existing = await ItemType.findOne({
    name: { $regex: `^${name.trim()}$`, $options: "i" },
    category: category,
    isDeleted: false,
  });

  if (existing) {
    throw new apiError(400, "Item type with this name already exists in the selected category");
  }

  const itemType = await ItemType.create({
    name: name.trim(),
    category: category,
    description: description ? description.trim() : null,
  });

  // Populate category for response
  await itemType.populate('category', 'name');

  return res
    .status(201)
    .json(new apiResponse(201, itemType, "Item type created successfully"));
});

/**
 * GET ALL: Item Types
 * GET /api/v1/itemtypes
 */
export const getAllItemTypes = asyncHandler(async (req, res) => {
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
  const itemTypes = await ItemType.find(filter)
    .populate('category', 'name code')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });

  // Total count
  const total = await ItemType.countDocuments(filter);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { items: itemTypes, meta: { page, limit, total } },
        "Item types retrieved successfully"
      )
    );
});

/**
 * GET BY ID: Item Type
 * GET /api/v1/itemtypes/:id
 */
export const getItemTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const itemType = await ItemType.findOne({
    _id: id,
    isDeleted: false,
  }).populate('category', 'name code');

  if (!itemType) {
    throw new apiError(404, "Item type not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, itemType, "Item type retrieved successfully"));
});

/**
 * UPDATE: Item Type
 * PUT /api/v1/itemtypes/:id
 */
export const updateItemType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, description, isActive } = req.body;

  const itemType = await ItemType.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!itemType) {
    throw new apiError(404, "Item type not found");
  }

  // Check category if being updated
  if (category && category !== itemType.category.toString()) {
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
      const existing = await ItemType.findOne({
        _id: { $ne: id },
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        category: category,
        isDeleted: false,
      });

      if (existing) {
        throw new apiError(400, "Item type with this name already exists in the selected category");
      }
    }

    itemType.category = category;
  }

  // Check duplicate name in same category if name is changing
  if (name && String(name).trim() && name.trim() !== itemType.name) {
    const existing = await ItemType.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name.trim()}$`, $options: "i" },
      category: itemType.category,
      isDeleted: false,
    });

    if (existing) {
      throw new apiError(400, "Item type with this name already exists in the selected category");
    }

    itemType.name = name.trim();
  }

  // Update other fields
  if (description !== undefined) {
    itemType.description = description ? description.trim() : null;
  }
  if (isActive !== undefined) {
    itemType.isActive = isActive;
  }

  await itemType.save();
  await itemType.populate('category', 'name code');

  return res
    .status(200)
    .json(new apiResponse(200, itemType, "Item type updated successfully"));
});

/**
 * DELETE: Item Type (Soft Delete)
 * DELETE /api/v1/itemtypes/:id
 */
export const deleteItemType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const itemType = await ItemType.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!itemType) {
    throw new apiError(404, "Item type not found");
  }

  itemType.isDeleted = true;
  await itemType.save();

  return res
    .status(200)
    .json(new apiResponse(200, null, "Item type deleted successfully"));
});

/**
 * GET BY CATEGORY: Get item types for a specific category
 * GET /api/v1/itemtypes/category/:categoryId
 */
export const getItemTypesByCategory = asyncHandler(async (req, res) => {
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

  const itemTypes = await ItemType.find({
    category: categoryId,
    isDeleted: false,
    isActive: true,
  }).sort({ name: 1 });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { items: itemTypes, category: category },
        "Item types retrieved successfully"
      )
    );
});
