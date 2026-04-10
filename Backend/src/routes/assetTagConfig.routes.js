import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createAssetTagConfig, getAssetTagConfig, previewNextAssetTag, listAssetTagConfigs } from "../controllers/assetTagConfig.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", verifyPermission("assets:access"), createAssetTagConfig);
router.get("/", verifyPermission("assets:inventory:view"), listAssetTagConfigs);
router.get("/preview/:assetTypeId", verifyPermission("assets:access"), previewNextAssetTag);
router.get("/:assetTypeId", verifyPermission("assets:inventory:view"), getAssetTagConfig);

export default router;
