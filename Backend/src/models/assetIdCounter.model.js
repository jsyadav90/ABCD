import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true // example: "assetId"
    },
    prefix: {
      type: String,
      required: true // example: "A26"
    },
    sequence: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
counterSchema.index({ sequence: 1 }); // Index on sequence for faster queries

export const Counter = mongoose.model("Counter", counterSchema);