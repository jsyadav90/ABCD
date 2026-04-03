/**
 * Asset Routes
 * Description: Assets ke create/list/get endpoints. Auth + permission guards applied.
 * - POST /api/v1/assets       -> create (AssetType ke hisaab se handler)
 * - GET  /api/v1/assets       -> list (optional ?AssetType=cpu/monitor)
 * - GET  /api/v1/assets/:id   -> get by id (try-all if type missing)
 */
import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createAsset, listAssets, getAssetById, countAssets, deleteAsset, toggleAssetStatus } from "../controllers/asset.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", verifyPermission("assets:access"), createAsset);
router.get("/", verifyPermission("assets:inventory:view"), listAssets);
router.get("/count", 
    // verifyPermission("assets:inventory:view"), 
    countAssets);
router.get("/:id", verifyPermission("assets:inventory:view"), getAssetById);
router.delete("/:id", verifyPermission("assets:rows_buttons:delete"), deleteAsset);
router.patch("/:id/status", verifyPermission("assets:rows_buttons:edit"), toggleAssetStatus);

export default router;

