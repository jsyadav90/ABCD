/**
 * Item Type Routes
 * Description: CRUD endpoints for item types
 * - POST   /api/v1/itemtypes              -> create
 * - GET    /api/v1/itemtypes              -> list with pagination
 * - GET    /api/v1/itemtypes/:id          -> get by id
 * - PUT    /api/v1/itemtypes/:id          -> update
 * - DELETE /api/v1/itemtypes/:id          -> delete (soft delete)
 * - GET    /api/v1/itemtypes/category/:categoryId -> get by category
 */
import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createItemType,
  getAllItemTypes,
  getItemTypeById,
  updateItemType,
  deleteItemType,
  getItemTypesByCategory,
} from "../controllers/itemtype.controller.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

/**
 * POST: Create new item type
 */
router.post("/", createItemType);

/**
 * GET: List all item types with pagination
 */
router.get("/", getAllItemTypes);

/**
 * GET: Get item types by category
 */
router.get("/category/:categoryId", getItemTypesByCategory);

/**
 * GET: Get item type by ID
 */
router.get("/:id", getItemTypeById);

/**
 * PUT: Update item type
 */
router.put("/:id", updateItemType);

/**
 * DELETE: Delete item type (soft delete)
 */
router.delete("/:id", deleteItemType);

export default router;
