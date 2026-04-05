import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
      // format: assetTag_<assetTypeId>
    },

    prefix: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    sequence: {
      type: Number,
      default: 0
    },

    assetType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetType",
      required: true
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const AssetTagCounter = mongoose.models.AssetTagCounter || mongoose.model("counters", counterSchema);