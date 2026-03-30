/**
 * Model: Mouse Peripheral
 * Description: Mouse-specific fields for peripheral assets. 
 * Collections: asset_peripheral_mouse
 */
import mongoose from "mongoose";

const mouseSchema = new mongoose.Schema(
  {
    // Mandatory first fields
    AssetCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetCategory",
      required: true
    },
    AssetType: { type: String, required: true, trim: true },
    AssetTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetType",
      default: null
    },

    // Basic Information
    AssetId: { type: String, trim: true, default: null },
    AssetTag: { type: String, trim: true, default: null },
    barcode: { type: String, trim: true, default: null },
    assetSubType: { type: String, trim: true, default: null },
    manufacturer: { type: String, trim: true, default: null },
    model: { type: String, trim: true, default: null },
    modelNumber: { type: String, trim: true, default: null },
    partNumber: { type: String, trim: true, default: null },
    serialNumber: { type: String, trim: true, default: null },
    ownershipType: { type: String, trim: true, default: null },
    manufacturingDate: { type: Date, default: null },

    // Location & Other Information
    location: { type: String, trim: true, default: null },
    locationType: { type: String, trim: true, default: null },
    building: { type: String, trim: true, default: null },
    floor: { type: String, trim: true, default: null },
    room: { type: String, trim: true, default: null },
    rackNumber: { type: String, trim: true, default: null },
    rackUnit: { type: Number, default: null },

    // Mouse Specifications
    mouseDPI: { type: String, trim: true, default: null }, // e.g., "1600 DPI", "800-3200 DPI"
    buttons: { type: Number, default: null }, // Number of buttons
    wheelType: { type: String, trim: true, default: null }, // "Scrollwheel", "None", "Special"
    ergonomic: { type: String, trim: true, default: null }, // "Yes" / "No"
    connectionType: { type: String, trim: true, default: null }, // "USB", "Wireless", "Bluetooth"
    sensorType: { type: String, trim: true, default: null }, // "Optical", "Laser"
    color: { type: String, trim: true, default: null },
    weight: { type: Number, default: null }, // grams

    // Item State
    AssetStatus: { type: String, trim: true, default: "active" },
    assetIsCurrently: { type: String, trim: true, default: "inStore" },
    AssetUser: { type: String, trim: true, default: null },
    AssignDate: { type: Date, default: null },

    // Infrastructure fields
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },

    isActive: { type: Boolean, default: true },
    inactiveAt: { type: Date, default: null },
    inactiveBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    inactiveReason: { type: String, trim: true, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedReason: { type: String, trim: true, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Summary field for quick listing
    summary: {
      AssetName: { type: String, trim: true, default: null },
      AssetTag: { type: String, trim: true, default: null },
      serialNumber: { type: String, trim: true, default: null },
      manufacturer: { type: String, trim: true, default: null },
      model: { type: String, trim: true, default: null },
    }
  },
  { timestamps: true, collection: "asset_peripheral" }
);

mouseSchema.pre("save", function (next) {
  if (this.summary) {
    this.summary.AssetName = [this.manufacturer, this.model].filter(Boolean).join(" ");
    this.summary.AssetTag = this.AssetTag || null;
    this.summary.serialNumber = this.serialNumber || null;
    this.summary.manufacturer = this.manufacturer || null;
    this.summary.model = this.model || null;
  }
  next();
});

mouseSchema.index({ organizationId: 1, branchId: 1 });
mouseSchema.index({ AssetType: 1, assetIsCurrently: 1 });

export const Mouse = mongoose.model("Mouse", mouseSchema);

