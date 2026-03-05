import mongoose from "mongoose";

const cpuSchema = new mongoose.Schema(
  {
    assetName: { type: String, required: true, trim: true },
    assetCategory: { type: String, default: null, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    deviceType: { type: String, default: null, trim: true },
    domain: { type: String, default: null, trim: true },

    osName: { type: String, default: null, trim: true },
    osEdition: { type: String, default: null, trim: true },
    osVersion: { type: String, default: null, trim: true },
    buildNumber: { type: String, default: null, trim: true },
    osLicenseKey: { type: String, default: null, trim: true },
    activationStatus: { type: String, default: null, trim: true },

    totalRamGB: { type: Number, default: null, min: 0 },
    ramType: { type: String, default: null, trim: true },
    ramSlotsUsed: { type: Number, default: null, min: 0 },

    cpuModel: { type: String, required: true, trim: true },
    cpuManufacturer: { type: String, required: true, trim: true },
    clockSpeedGHz: { type: Number, default: null, min: 0 },
    cores: { type: Number, default: null, min: 0 },
    threads: { type: Number, default: null, min: 0 },
    virtualizationEnabled: { type: Boolean, default: false },

    storageType: { type: String, default: null, trim: true },
    diskModel: { type: String, default: null, trim: true },
    diskSerial: { type: String, default: null, trim: true },
    diskCapacityGB: { type: Number, default: null, min: 0 },
    raidConfigured: { type: Boolean, default: false },
    encryptionEnabled: { type: Boolean, default: false },

    biosVersion: { type: String, default: null, trim: true },
    biosDate: { type: Date, default: null },
    motherboardSerial: { type: String, default: null, trim: true },
    hardwareUUID: { type: String, default: null, trim: true },
    tpmVersion: { type: String, default: null, trim: true },
    secureBootEnabled: { type: Boolean, default: false },

    assetTag: { type: String, required: true, trim: true, index: true },
    serialNumber: { type: String, required: true, trim: true, index: true },
    vendor: { type: String, default: null, trim: true },
    purchaseCost: { type: Number, default: null, min: 0 },
    acquisitionDate: { type: Date, default: null },
    warrantyExpiryDate: { type: Date, default: null },
    depreciationMethod: { type: String, default: null, trim: true },
    usefulLifeYears: { type: Number, default: null, min: 0 },
    residualValue: { type: Number, default: null, min: 0 },

    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    building: { type: String, default: null, trim: true },
    floor: { type: String, default: null, trim: true },
    room: { type: String, default: null, trim: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignmentDate: { type: Date, default: null },

    lifecycleStatus: { type: String, default: null, trim: true },
    operationalStatus: { type: String, default: null, trim: true },
    lastAuditDate: { type: Date, default: null },
    remarks: { type: String, default: null, trim: true },

    hostname: { type: String, default: null, trim: true },
    ipAddress: { type: String, default: null, trim: true },
    macAddress: { type: String, default: null, trim: true },
    nicType: { type: String, default: null, trim: true },
    vlan: { type: String, default: null, trim: true },
    dhcpEnabled: { type: Boolean, default: false },
    dnsHostname: { type: String, default: null, trim: true },

    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, collection: "asset_cpu" }
);

cpuSchema.index({ manufacturer: 1, model: 1, isDeleted: 1 });
cpuSchema.index({ organizationId: 1, branchId: 1, isActive: 1 });
cpuSchema.index({ serialNumber: 1 }, { sparse: true });
cpuSchema.index({ assetTag: 1 }, { sparse: true });
cpuSchema.index({ createdAt: -1 });

cpuSchema.pre("validate", function () {
  const trimStr = (v) => (typeof v === "string" ? v.trim() : v);
  this.assetName = trimStr(this.assetName);
  this.assetCategory = trimStr(this.assetCategory);
  this.manufacturer = trimStr(this.manufacturer);
  this.model = trimStr(this.model);
  this.deviceType = trimStr(this.deviceType);
  this.domain = trimStr(this.domain);
  this.osName = trimStr(this.osName);
  this.osEdition = trimStr(this.osEdition);
  this.osVersion = trimStr(this.osVersion);
  this.buildNumber = trimStr(this.buildNumber);
  this.osLicenseKey = trimStr(this.osLicenseKey);
  this.activationStatus = trimStr(this.activationStatus);
  this.ramType = trimStr(this.ramType);
  this.cpuModel = trimStr(this.cpuModel);
  this.cpuManufacturer = trimStr(this.cpuManufacturer);
  this.storageType = trimStr(this.storageType);
  this.diskModel = trimStr(this.diskModel);
  this.diskSerial = trimStr(this.diskSerial);
  this.biosVersion = trimStr(this.biosVersion);
  this.motherboardSerial = trimStr(this.motherboardSerial);
  this.hardwareUUID = trimStr(this.hardwareUUID);
  this.tpmVersion = trimStr(this.tpmVersion);
  this.assetTag = trimStr(this.assetTag);
  this.serialNumber = trimStr(this.serialNumber);
  this.vendor = trimStr(this.vendor);
  this.building = trimStr(this.building);
  this.floor = trimStr(this.floor);
  this.room = trimStr(this.room);
  this.lifecycleStatus = trimStr(this.lifecycleStatus);
  this.operationalStatus = trimStr(this.operationalStatus);
  this.remarks = trimStr(this.remarks);
  this.hostname = trimStr(this.hostname);
  this.ipAddress = trimStr(this.ipAddress);
  this.macAddress = trimStr(this.macAddress);
  this.nicType = trimStr(this.nicType);
  this.vlan = trimStr(this.vlan);
  this.dnsHostname = trimStr(this.dnsHostname);
});

const CPU = mongoose.model("CPU", cpuSchema);
export { CPU };
