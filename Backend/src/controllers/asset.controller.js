import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { CPU } from "../models/cpu.model.js";

const pickBaseFields = (body = {}) => {
  const baseKeys = [
    "itemType",
    "assetName",
    "manufacturer",
    "model",
    "serialNumber",
    "assetTag",
    "barcode",
    "purchaseCost",
    "acquisitionDate",
    "warrantyExpiryDate",
    "location",
    "lifecycleStatus",
    "operationalStatus",
    "remarks",
    "branchId",
    "assignedToUserId",
  ];
  const base = {};
  for (const k of baseKeys) {
    if (body[k] !== undefined) base[k] = body[k];
  }
  return base;
};

export const createAsset = asyncHandler(async (req, res) => {
  const { itemType } = req.body;
  if (!itemType || !String(itemType).trim()) {
    throw new apiError(400, "itemType is required");
  }

  const normalizedType = String(itemType).trim().toLowerCase();

  if (normalizedType === "cpu") {
    const v = (val) => {
      if (val === undefined || val === null) return null;
      return typeof val === "string" ? val.trim() : val;
    };
    const toBool = (val) => {
      if (val === undefined || val === null) return false;
      if (typeof val === "boolean") return val;
      const s = String(val).toLowerCase();
      return s === "yes" || s === "true" || s === "1";
    };

    const cpuPayload = {
      assetName: v(req.body.assetName),
      assetCategory: v(req.body.assetCategory),
      manufacturer: v(req.body.manufacturer),
      model: v(req.body.model),
      deviceType: v(req.body.deviceType),
      domain: v(req.body.domain),

      osName: v(req.body.osName),
      osEdition: v(req.body.osEdition),
      osVersion: v(req.body.osVersion),
      buildNumber: v(req.body.buildNumber),
      osLicenseKey: v(req.body.osLicenseKey),
      activationStatus: v(req.body.activationStatus),

      totalRamGB: req.body.totalRamGB != null ? Number(req.body.totalRamGB) : null,
      ramType: v(req.body.ramType),
      ramSlotsUsed: req.body.ramSlotsUsed != null ? Number(req.body.ramSlotsUsed) : null,

      cpuModel: v(req.body.cpuModel),
      cpuManufacturer: v(req.body.cpuManufacturer),
      clockSpeedGHz: req.body.clockSpeedGHz != null ? Number(req.body.clockSpeedGHz) : null,
      cores: req.body.cores != null ? Number(req.body.cores) : null,
      threads: req.body.threads != null ? Number(req.body.threads) : null,
      virtualizationEnabled: toBool(req.body.virtualizationEnabled),

      storageType: v(req.body.storageType),
      diskModel: v(req.body.diskModel),
      diskSerial: v(req.body.diskSerial),
      diskCapacityGB: req.body.diskCapacityGB != null ? Number(req.body.diskCapacityGB) : null,
      raidConfigured: toBool(req.body.raidConfigured),
      encryptionEnabled: toBool(req.body.encryptionEnabled),

      biosVersion: v(req.body.biosVersion),
      biosDate: req.body.biosDate || null,
      motherboardSerial: v(req.body.motherboardSerial),
      hardwareUUID: v(req.body.hardwareUUID),
      tpmVersion: v(req.body.tpmVersion),
      secureBootEnabled: toBool(req.body.secureBootEnabled),

      assetTag: v(req.body.assetTag),
      serialNumber: v(req.body.serialNumber),
      vendor: v(req.body.vendor),
      purchaseCost: req.body.purchaseCost != null ? Number(req.body.purchaseCost) : null,
      acquisitionDate: req.body.acquisitionDate || null,
      warrantyExpiryDate: req.body.warrantyExpiryDate || null,
      depreciationMethod: v(req.body.depreciationMethod),
      usefulLifeYears: req.body.usefulLifeYears != null ? Number(req.body.usefulLifeYears) : null,
      residualValue: req.body.residualValue != null ? Number(req.body.residualValue) : null,

      branch: req.body.branchId || req.body.branch || null,
      building: v(req.body.building),
      floor: v(req.body.floor),
      room: v(req.body.room),
      assignedTo: req.body.assignedTo || null,
      assignmentDate: req.body.assignmentDate || null,

      lifecycleStatus: v(req.body.lifecycleStatus),
      operationalStatus: v(req.body.operationalStatus),
      lastAuditDate: req.body.lastAuditDate || null,
      remarks: v(req.body.remarks),

      hostname: v(req.body.hostname),
      ipAddress: v(req.body.ipAddress),
      macAddress: v(req.body.macAddress),
      nicType: v(req.body.nicType),
      vlan: v(req.body.vlan),
      dhcpEnabled: toBool(req.body.dhcpEnabled),
      dnsHostname: v(req.body.dnsHostname),

      organizationId: req.user?.organizationId || null,
      branchId: req.body.branchId || req.body.branch || null,
      createdBy: req.user?._id || req.user?.id,
      updatedBy: null,
    };

    const doc = await CPU.create(cpuPayload);
    return res.status(201).json(new apiResponse(201, doc, "CPU asset created successfully"));
  }

  throw new apiError(400, "Unsupported itemType. Only 'cpu' is currently supported.");
});

export const listAssets = asyncHandler(async (req, res) => {
  const { itemType, isActive, branchId } = req.query;
  const type = String(itemType || "").trim().toLowerCase();
  if (type !== "cpu") {
    throw new apiError(400, "Unsupported itemType. Only 'cpu' listing is available.");
  }
  const filter = { isDeleted: false };
  if (isActive !== undefined) filter.isActive = String(isActive) === "true";
  if (branchId) filter.branchId = branchId;
  if (req.user?.organizationId) filter.organizationId = req.user.organizationId;
  const items = await CPU.find(filter).sort({ createdAt: -1 }).lean();
  return res.status(200).json(new apiResponse(200, { items }, "CPU assets retrieved"));
});

export const getAssetById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { itemType } = req.query;
  const type = String(itemType || "").trim().toLowerCase();
  if (type !== "cpu") {
    throw new apiError(400, "Unsupported itemType. Only 'cpu' details are available.");
  }
  const doc = await CPU.findById(id).lean();
  if (!doc || doc.isDeleted) {
    throw new apiError(404, "Asset not found");
  }
  if (req.user?.organizationId && String(doc.organizationId) !== String(req.user.organizationId)) {
    throw new apiError(403, "Access denied for this asset");
  }
  return res.status(200).json(new apiResponse(200, doc, "CPU asset retrieved"));
});
