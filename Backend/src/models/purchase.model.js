import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    itemCategory: { type: String, trim: true, default: null },
    itemType: { type: String, trim: true, default: null },

    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null, index: true },

    purchaseType: { type: String, trim: true, default: null },
    poNumber: { type: String, trim: true, default: null },
    poDate: { type: Date, default: null },
    receiptNumber: { type: String, trim: true, default: null },
    receiptDate: { type: Date, default: null },
    purchaseDate: { type: Date, default: null },
    vendorId: { type: String, trim: true, default: null },

    itemReceivedOn: { type: String, trim: true, default: null },
    invoiceNumber: { type: String, trim: true, default: null },
    invoiceDate: { type: Date, default: null },
    deliveryChallanNumber: { type: String, trim: true, default: null },
    deliveryChallanDate: { type: Date, default: null },

    purchaseCost: { type: Number, default: null },
    taxAmount: { type: Number, default: null },
    totalAmount: { type: Number, default: null },
    currency: { type: String, trim: true, default: null },

    deliveryDate: { type: Date, default: null },
    receivedBy: { type: String, trim: true, default: null },

    isActive: { type: Boolean, default: true },
    inactiveAt: { type: Date, default: null },
    inactiveBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    inactiveReason: { type: String, trim: true, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedReason: { type: String, trim: true, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, collection: "asset_purchases" }
);

purchaseSchema.index(
  { organizationId: 1, assetId: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Purchase = mongoose.model("Purchase", purchaseSchema);

