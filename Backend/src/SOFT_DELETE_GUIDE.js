/**
 * SOFT DELETE IMPLEMENTATION GUIDE
 * ================================
 * 
 * This guide explains how to implement soft deletes in your backend controllers.
 * All asset models (CPU, Laptop, Monitor) and other core models now support soft deletes.
 * 
 * SCHEMA FIELDS ADDED TO ALL MODELS:
 * - isDeleted: Boolean (default: false)
 * - deletedAt: Date (default: null) - timestamp when record was deleted
 * - deletedBy: ObjectId (ref: User, default: null) - user who deleted the record
 * 
 * USAGE EXAMPLES:
 */

// ============================================================
// EXAMPLE 1: Delete a single asset in Asset Controller
// ============================================================
/*
import { softDeleteOne, queryActive } from "../utils/softDeleteUtils.js";
import { CPU } from "../models/cpu.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const deleteAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id; // from auth middleware

  const asset = await softDeleteOne(CPU, id, userId);
  
  if (!asset) {
    throw new apiError(404, "Asset not found");
  }

  res.status(200).json(
    new apiResponse(200, asset, "Asset deleted successfully")
  );
});
*/

// ============================================================
// EXAMPLE 2: Get only active (non-deleted) assets
// ============================================================
/*
import { queryActive } from "../utils/softDeleteUtils.js";
import { CPU } from "../models/cpu.model.js";

export const getActiveAssets = asyncHandler(async (req, res) => {
  // This automatically filters out soft-deleted records
  const assets = await queryActive(CPU, { organizationId: req.user.organizationId })
    .select("-__v")
    .lean();

  res.status(200).json(
    new apiResponse(200, assets, "Active assets fetched")
  );
});
*/

// ============================================================
// EXAMPLE 3: Restore a soft-deleted asset
// ============================================================
/*
import { restoreOne } from "../utils/softDeleteUtils.js";
import { CPU } from "../models/cpu.model.js";

export const restoreAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const asset = await restoreOne(CPU, id);
  
  if (!asset) {
    throw new apiError(404, "Asset not found");
  }

  res.status(200).json(
    new apiResponse(200, asset, "Asset restored successfully")
  );
});
*/

// ============================================================
// EXAMPLE 4: Bulk delete multiple assets
// ============================================================
/*
import { softDeleteMany } from "../utils/softDeleteUtils.js";
import { CPU } from "../models/cpu.model.js";

export const bulkDeleteAssets = asyncHandler(async (req, res) => {
  const { assetIds } = req.body; // Array of IDs: ["id1", "id2", "id3"]
  const userId = req.user._id;

  const result = await softDeleteMany(CPU, assetIds, userId);
  
  res.status(200).json(
    new apiResponse(200, result, `${result.modifiedCount} assets deleted`)
  );
});
*/

// ============================================================
// EXAMPLE 5: Delete assets by brand/manufacturer
// ============================================================
/*
import { softDeleteByFilter } from "../utils/softDeleteUtils.js";
import { CPU } from "../models/cpu.model.js";

export const deleteAssetsByBrand = asyncHandler(async (req, res) => {
  const { manufacturer } = req.params;
  const userId = req.user._id;

  const result = await softDeleteByFilter(
    CPU,
    { manufacturer, organizationId: req.user.organizationId },
    userId
  );

  res.status(200).json(
    new apiResponse(200, result, `${result.modifiedCount} assets deleted`)
  );
});
*/

// ============================================================
// EXAMPLE 6: Get only deleted assets (for recovery/audit)
// ============================================================
/*
import { queryDeleted } from "../utils/softDeleteUtils.js";
import { CPU } from "../models/cpu.model.js";

export const getDeletedAssets = asyncHandler(async (req, res) => {
  const deletedAssets = await queryDeleted(
    CPU,
    { organizationId: req.user.organizationId }
  )
    .select("-__v")
    .lean();

  res.status(200).json(
    new apiResponse(200, deletedAssets, "Deleted assets fetched")
  );
});
*/

// ============================================================
// EXAMPLE 7: Count active assets
// ============================================================
/*
import { countActive } from "../utils/softDeleteUtils.js";
import { CPU } from "../models/cpu.model.js";

export const getActiveAssetCount = asyncHandler(async (req, res) => {
  const count = await countActive(CPU, {
    organizationId: req.user.organizationId
  });

  res.status(200).json(
    new apiResponse(200, { count }, "Active asset count")
  );
});
*/

// ============================================================
// EXAMPLE 8: Using soft delete with MODELS THAT HAVE IT
// ============================================================
/*
Models now supporting soft deletes:

ASSET MODELS:
- CPU
- Laptop
- Monitor

CORE MODELS:
- AssetCategory
- ItemType
- Warranty
- Branch
- Organization
- Role (already had soft delete)

All of them can be used with the softDeleteUtils functions.

EXAMPLE for AssetCategory:
*/
import { softDeleteOne, queryActive } from "../utils/softDeleteUtils.js";
import { AssetCategory } from "../models/assetcategory.model.js";

export const deleteAssetCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const category = await softDeleteOne(AssetCategory, id, userId);
  
  if (!category) {
    throw new apiError(404, "Category not found");
  }

  res.status(200).json(
    new apiResponse(200, category, "Category deleted successfully")
  );
});

// ============================================================
// IMPORTANT NOTES:
// ============================================================
/*
1. ALWAYS use queryActive() when fetching lists to exclude deleted records
   WRONG:  const assets = await CPU.find({...})
   RIGHT:  const assets = await queryActive(CPU, {...})

2. When counting, use countActive() instead of countDocuments()
   WRONG:  await CPU.countDocuments({...})
   RIGHT:  await countActive(CPU, {...})

3. The deletedBy field will automatically store the user ID who deleted the record

4. Use restoreOne() or restoreMany() to restore soft-deleted records

5. For compliance/data cleanup: use hardDelete() or hardDeleteOldRecords()
   (These are permanent and cannot be undone!)

6. Frontend will NOT see soft-deleted records automatically - backend handles filtering

7. For audit trails: query with queryDeleted() to see what was deleted and by whom
*/
