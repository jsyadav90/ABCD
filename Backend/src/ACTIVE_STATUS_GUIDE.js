/**
 * ISACTIVE STATUS MANAGEMENT IMPLEMENTATION GUIDE
 * ===============================================
 * 
 * This guide explains how to implement isActive status management in your controllers.
 * All models (Assets, Categories, AssetTypes, Roles, etc.) now support status management.
 * 
 * BENEFITS OF THIS APPROACH:
 * - Non-destructive: Records stay in database but are hidden from users
 * - Reversible: Can be reactivated anytime
 * - Audit trail: Tracks who changed the status (updatedBy field)
 * - Perfect for: Deactivating users, disabling roles, suspending assets temporarily
 * 
 * USAGE EXAMPLES:
 */

// ============================================================
// EXAMPLE 1: Deactivate a single asset
// ============================================================
/*
import { deactivateOne } from "../utils/activeStatusUtils.js";
import { CPU } from "../models/cpu.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const deactivateAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const asset = await deactivateOne(CPU, id, userId);
  
  if (!asset) {
    throw new apiError(404, "Asset not found");
  }

  res.status(200).json(
    new apiResponse(200, asset, "Asset deactivated successfully")
  );
});
*/

// ============================================================
// EXAMPLE 2: Activate a single asset
// ============================================================
/*
import { activateOne } from "../utils/activeStatusUtils.js";
import { CPU } from "../models/cpu.model.js";

export const activateAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const asset = await activateOne(CPU, id, userId);
  
  if (!asset) {
    throw new apiError(404, "Asset not found");
  }

  res.status(200).json(
    new apiResponse(200, asset, "Asset activated successfully")
  );
});
*/

// ============================================================
// EXAMPLE 3: Toggle status (active <-> inactive)
// ============================================================
/*
import { toggleActive } from "../utils/activeStatusUtils.js";
import { CPU } from "../models/cpu.model.js";

export const toggleAssetStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const asset = await toggleActive(CPU, id, userId);
  
  if (!asset) {
    throw new apiError(404, "Asset not found");
  }

  const statusText = asset.isActive ? "activated" : "deactivated";
  res.status(200).json(
    new apiResponse(200, asset, `Asset ${statusText} successfully`)
  );
});
*/

// ============================================================
// EXAMPLE 4: Bulk deactivate multiple assets
// ============================================================
/*
import { deactivateMany } from "../utils/activeStatusUtils.js";
import { CPU } from "../models/cpu.model.js";

export const bulkDeactivateAssets = asyncHandler(async (req, res) => {
  const { assetIds } = req.body; // ["id1", "id2", "id3"]
  const userId = req.user._id;

  const result = await deactivateMany(CPU, assetIds, userId);
  
  res.status(200).json(
    new apiResponse(
      200,
      result,
      `${result.modifiedCount} assets deactivated`
    )
  );
});
*/

// ============================================================
// EXAMPLE 5: Bulk activate multiple assets
// ============================================================
/*
import { activateMany } from "../utils/activeStatusUtils.js";
import { CPU } from "../models/cpu.model.js";

export const bulkActivateAssets = asyncHandler(async (req, res) => {
  const { assetIds } = req.body;
  const userId = req.user._id;

  const result = await activateMany(CPU, assetIds, userId);
  
  res.status(200).json(
    new apiResponse(200, result, `${result.modifiedCount} assets activated`)
  );
});
*/

// ============================================================
// EXAMPLE 6: Get only active assets
// ============================================================
/*
import { queryActive } from "../utils/activeStatusUtils.js";
import { CPU } from "../models/cpu.model.js";

export const getActiveAssets = asyncHandler(async (req, res) => {
  // Automatically filters only isActive: true records
  const assets = await queryActive(CPU, {
    organizationId: req.user.organizationId,
  })
    .select("-__v")
    .lean();

  res.status(200).json(
    new apiResponse(200, assets, "Active assets fetched")
  );
});
*/

// ============================================================
// EXAMPLE 7: Get only inactive assets (suspended/disabled)
// ============================================================
/*
import { queryInactive } from "../utils/activeStatusUtils.js";
import { CPU } from "../models/cpu.model.js";

export const getInactiveAssets = asyncHandler(async (req, res) => {
  const assets = await queryInactive(CPU, {
    organizationId: req.user.organizationId,
  })
    .select("-__v")
    .lean();

  res.status(200).json(
    new apiResponse(200, assets, "Inactive assets fetched")
  );
});
*/

// ============================================================
// EXAMPLE 8: Deactivate by filter (e.g., old assets)
// ============================================================
/*
import { deactivateByFilter } from "../utils/activeStatusUtils.js";
import { CPU } from "../models/cpu.model.js";

export const deactivateOldAssets = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const result = await deactivateByFilter(
    CPU,
    {
      organizationId: req.user.organizationId,
      createdAt: { $lt: oneYearAgo },
      isActive: true,
    },
    userId
  );

  res.status(200).json(
    new apiResponse(
      200,
      result,
      `${result.modifiedCount} old assets deactivated`
    )
  );
});
*/

// ============================================================
// EXAMPLE 9: Get status statistics
// ============================================================
/*
import { getStatusInfo } from "../utils/activeStatusUtils.js";
import { CPU } from "../models/cpu.model.js";

export const getAssetStatusStats = asyncHandler(async (req, res) => {
  const stats = await getStatusInfo(CPU, {
    organizationId: req.user.organizationId,
  });

  // Returns: { active: 45, inactive: 12, total: 57 }

  res.status(200).json(
    new apiResponse(200, stats, "Asset status statistics")
  );
});
*/

// ============================================================
// EXAMPLE 10: Deactivate a user
// ============================================================
/*
import { deactivateOne } from "../utils/activeStatusUtils.js";
import { User } from "../models/user.model.js";

export const deactivateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const adminId = req.user._id;

  const user = await deactivateOne(User, userId, adminId);
  
  if (!user) {
    throw new apiError(404, "User not found");
  }

  res.status(200).json(
    new apiResponse(200, user, "User deactivated successfully")
  );
});
*/

// ============================================================
// EXAMPLE 11: Deactivate a role
// ============================================================
/*
import { deactivateOne } from "../utils/activeStatusUtils.js";
import { Role } from "../models/role.model.js";

export const deactivateRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const userId = req.user._id;

  const role = await deactivateOne(Role, roleId, userId);
  
  if (!role) {
    throw new apiError(404, "Role not found");
  }

  res.status(200).json(
    new apiResponse(200, role, "Role deactivated successfully")
  );
});
*/

// ============================================================
// MODELS SUPPORTING ISACTIVE:
// ============================================================
/*
ALL MODELS:
[OK] CPU
[OK] Laptop
[OK] Monitor
[OK] AssetCategory
[OK] AssetType
[OK] Warranty
[OK] Branch
[OK] Organization
[OK] Role
[OK] User (already has it)
[OK] Purchase (check if it has it)

Use the same functions for all models!
*/

// ============================================================
// IMPORTANT NOTES:
// ============================================================
/*
1. ALWAYS use queryActive() when fetching active lists
   WRONG:  const assets = await CPU.find({...})
   RIGHT:  const assets = await queryActive(CPU, {...})

2. The updatedBy field will automatically track who changed status

3. Use countActive() and countInactive() for statistics

4. getStatusInfo() returns a summary: { active, inactive, total }

5. Don't mix soft delete (isDeleted) with isActive:
   - isActive: For temporary disable/suspend (reversible, visible in admin)
   - isDeleted: For permanent removal (soft delete, hidden from users)

6. Deactivated records are still in DB - good for:
   - Temporarily suspending users/roles
   - Archiving old assets
   - Hiding obsolete categories
   - Disabling vendors/suppliers

7. Use toggleActive() when users can enable/disable their own preferences
*/

