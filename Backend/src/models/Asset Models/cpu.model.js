import mongoose from "mongoose";

const cpuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true, lowercase: true },
    model: { type: String, required: true, trim: true },
    serialNumber: { type: String, default: null, trim: true },
    socket: { type: String, default: null, trim: true, lowercase: true },
    architecture: { type: String, default: null, trim: true, lowercase: true },
    cores: { type: Number, default: 1, min: 1 },
    threads: { type: Number, default: 1, min: 1 },
    baseClockMHz: { type: Number, default: null, min: 0 },
    maxClockMHz: { type: Number, default: null, min: 0 },
    tdpWatts: { type: Number, default: null, min: 0 },
    cacheL1KB: { type: Number, default: null, min: 0 },
    cacheL2KB: { type: Number, default: null, min: 0 },
    cacheL3MB: { type: Number, default: null, min: 0 },
    virtualizationSupport: { type: Boolean, default: false },
    hyperThreading: { type: Boolean, default: false },
    integratedGraphics: { type: Boolean, default: false },
    eccSupport: { type: Boolean, default: false },
    aesSupport: { type: Boolean, default: false },
    avx: { type: Boolean, default: false },
    avx2: { type: Boolean, default: false },
    avx512: { type: Boolean, default: false },
    sse: { type: Boolean, default: false },
    productionDate: { type: Date, default: null },
    microcodeVersion: { type: String, default: null, trim: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    assetTag: { type: String, default: null, trim: true },
    barcode: { type: String, default: null, trim: true },
    purchaseCost: { type: Number, default: null, min: 0 },
    purchaseDate: { type: Date, default: null },
    warrantyExpiry: { type: Date, default: null },
    location: { type: String, default: null, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    metadata: { type: Map, of: String, default: new Map() },
  },
  { timestamps: true, collection: "asset_cpu" }
);

cpuSchema.index({ manufacturer: 1, model: 1, socket: 1, isDeleted: 1 });
cpuSchema.index({ organizationId: 1, branchId: 1, isActive: 1 });
cpuSchema.index({ serialNumber: 1 }, { sparse: true });
cpuSchema.index({ createdAt: -1 });

cpuSchema.pre("validate", function () {
  if (typeof this.name === "string") this.name = this.name.trim();
  if (typeof this.model === "string") this.model = this.model.trim();
  if (typeof this.serialNumber === "string") this.serialNumber = this.serialNumber.trim();
  if (typeof this.assetTag === "string") this.assetTag = this.assetTag.trim();
  if (typeof this.barcode === "string") this.barcode = this.barcode.trim();
  if (typeof this.location === "string") this.location = this.location.trim();
  if (typeof this.manufacturer === "string") this.manufacturer = this.manufacturer.trim().toLowerCase();
  if (typeof this.socket === "string") this.socket = this.socket.trim().toLowerCase();
  if (typeof this.architecture === "string") this.architecture = this.architecture.trim().toLowerCase();
});

const CPU = mongoose.model("CPU", cpuSchema);
export { CPU };
