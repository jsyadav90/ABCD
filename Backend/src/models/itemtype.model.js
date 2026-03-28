/**
 * Model: Item Type
 * Description: Stores unique item types (CPU, Monitor, Laptop, etc.) with their categories
 * Collection: item_types
 */
import mongoose from "mongoose";

const itemTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetCategory",
      required: true,
    },
    description: {
      type: String,
      trim: true,
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
    collection: "item_types",
  }
);

// Compound index to ensure unique name per category
itemTypeSchema.index({ name: 1, category: 1 }, { unique: true });

export const ItemType = mongoose.model("ItemType", itemTypeSchema);
