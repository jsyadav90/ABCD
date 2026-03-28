import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    branchCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    branchName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["MAIN", "SUB", "SATELLITE"],
      default: "SUB",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
    contactInfo: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, default: "India", trim: true },
    },
    geoLocation: {
      latitude: Number,
      longitude: Number,
    },
    assetStats: {
      totalAssets: { type: Number, default: 0 },
      assignedAssets: { type: Number, default: 0 },
      availableAssets: { type: Number, default: 0 },
      inRepair: { type: Number, default: 0 },
      disposed: { type: Number, default: 0 },
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    settings: {
      allowAssetTransfer: { type: Boolean, default: true },
      allowUserTransfer: { type: Boolean, default: true },
    },
    metadata: {
      establishedYear: Number,
      capacity: Number,
      notes: String,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true, index: true },
    inactiveAt: { type: Date, default: null },
    inactiveBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    inactiveReason: { type: String, trim: true, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedReason: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

branchSchema.index({ organizationId: 1, branchCode: 1 }, { unique: true });

export const Branch = mongoose.model("Branch", branchSchema);
