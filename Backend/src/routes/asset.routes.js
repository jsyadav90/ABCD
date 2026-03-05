import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createAsset, listAssets, getAssetById } from "../controllers/asset.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", verifyPermission("assets:access"), createAsset);
router.get("/", verifyPermission("assets:inventory:view"), listAssets);
router.get("/:id", verifyPermission("assets:inventory:view"), getAssetById);

export default router;
