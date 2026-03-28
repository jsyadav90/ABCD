/**
 * Model: Asset Category
 * Description: Asset categories (CPU, Monitor, Laptop, etc.)
 * Collection: asset_categories
 */
import mongoose from "mongoose";

const assetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // This allows multiple missing values
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    inactiveAt: {
      type: Date,
      default: null,
    },
    inactiveBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    inactiveReason: {
      type: String,
      trim: true,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "asset_categories",
  }
);

export const AssetCategory = mongoose.model("AssetCategory", assetCategorySchema);
