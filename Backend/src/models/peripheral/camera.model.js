/**
 * Model: Camera Peripheral
 * Description: Camera-specific fields for peripheral assets. 
 * Collections: asset_peripheral_camera
 * Handles all camera fields from the frontend form including specs, audio, connectivity, and physical properties.
 */
import mongoose from "mongoose";

const cameraSchema = new mongoose.Schema(
  {
    // Mandatory first fields
    assetCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetCategory",
      required: true
    },
    assetType: { type: String, required: true, trim: true },
    assetTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "assetType",
      default: null
    },

    // Basic Information
    assetId: { type: String, trim: true, default: null },
    assetTag: { type: String, trim: true, default: null },
    barcode: { type: String, trim: true, default: null },
    assetSubType: { type: String, trim: true, default: null },
    manufacturer: { type: String, trim: true, default: null },
    model: { type: String, trim: true, default: null },
    modelNumber: { type: String, trim: true, default: null },
    partNumber: { type: String, trim: true, default: null },
    serialNumber: { type: String, trim: true, default: null },
    ownershipType: { type: String, trim: true, default: null },
    manufacturingDate: { type: Date, default: null },

    // Camera Specifications
    resolution: { type: String, trim: true, default: null }, // e.g., 8K UHD (7680×4320), 4K UHD (3840×2160), 1080p Full HD (1920×1080), 720p HD (1280×720), 1440p 2K (2560×1440), 480p (640×480)
    frameRate: { type: Number, default: null }, // FPS (0-240)
    sensorType: { type: String, trim: true, default: null }, // "CMOS" or "CCD"
    fieldOfView: { type: Number, default: null }, // Degrees (0-180)
    autoFocus: { type: String, trim: true, default: null }, // "Yes" / "No"

    // Audio Features
    builtInMicrophone: { type: String, trim: true, default: null }, // "Yes" / "No"
    microphoneType: { type: String, trim: true, default: null }, // e.g., Shown only if builtInMicrophone is "Yes". "Mono", "Stereo", "Omnidirectional", "Cardioid"
    noiseReduction: { type: String, trim: true, default: null }, // Shown only if builtInMicrophone is "Yes". "Yes" / "No"

    // Connectivity
    connectionType: { type: String, trim: true, default: null }, // "USB", "USB-C", "Wireless"  
    cableLength: { type: Number, default: null }, // shown if connectionType is "USB" or "USB-C", in meters
    plugAndPlay: { type: String, trim: true, default: null }, // shown if connectionType is "USB" or "USB-C" "Yes" / "No"

    // Mounting & Physical
    mountType: { type: String, trim: true, default: null }, // "Monitor Clip", "Tripod Mount", "Wall Mount"
    color: { type: String, trim: true, default: null },
    weight: { type: Number, default: null }, // grams

    // Asset State
    assetStatus: { type: String, trim: true, default: "active" }, // "active", "inactive", "", ""
    assetIsCurrently: { type: String, trim: true, default: "inStore" }, // "inStore", "assigned",
    assetUser: { type: String, trim: true, default: null }, // Shown if assetIsCurrently is "assigned",
    assignDate: { type: Date, default: null }, // Shown if assetIsCurrently is "assigned",
    expectedReturnDate: { type: Date, default: null }, // Shown if assetIsCurrently is "assigned",

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
      assetName: { type: String, trim: true, default: null },
      assetTag: { type: String, trim: true, default: null },
      serialNumber: { type: String, trim: true, default: null },
      manufacturer: { type: String, trim: true, default: null },
      model: { type: String, trim: true, default: null },
    }
  },
  { timestamps: true, collection: "asset_peripheral" }
);

// Indices for performance
cameraSchema.index({ organizationId: 1, branchId: 1, AssetCategory: 1, assetType: 1, isDeleted: 1, createdAt: -1 });
cameraSchema.index({ assetId: 1 }, { sparse: true });
cameraSchema.index({ serialNumber: 1 }, { sparse: true });

// Pre-save hook to populate summary
cameraSchema.pre("save", function () {
  this.summary = {
    assetName: this.assetId || "Camera",
    assetTag: this.assetTag || this.assetId || "N/A",
    barcode: this.barcode || "N/A",
    serialNumber: this.serialNumber || "N/A",
    manufacturer: this.manufacturer || "N/A",
    model: this.model || "N/A",
  };
});

const Camera = mongoose.model("Camera", cameraSchema);
export { Camera };

