/**
 * Asset Type Routes
 * Description: CRUD endpoints for asset types
 * - POST   /api/v1/assettypes              -> create
 * - GET    /api/v1/assettypes              -> list with pagination
 * - GET    /api/v1/assettypes/:id          -> get by id
 * - PUT    /api/v1/assettypes/:id          -> update
 * - DELETE /api/v1/assettypes/:id          -> delete (soft delete)
 * - GET    /api/v1/assettypes/category/:categoryId -> get by category
 */
import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createAssetType,
  getAllAssetTypes,
  getAssetTypeById,
  updateAssetType,
  deleteAssetType,
  getAssetTypesByCategory,
} from "../controllers/assettype.controller.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

/**
 * POST: Create new asset type
 */
router.post("/", createAssetType);

/**
 * GET: List all asset types with pagination
 */
router.get("/", getAllAssetTypes);

/**
 * GET: Get asset types by category
 */
router.get("/category/:categoryId", getAssetTypesByCategory);

/**
 * GET: Get asset type by ID
 */
router.get("/:id", getAssetTypeById);

/**
 * PUT: Update asset type
 */
router.put("/:id", updateAssetType);

/**
 * DELETE: Delete asset type (soft delete)
 */
router.delete("/:id", deleteAssetType);

export default router;

