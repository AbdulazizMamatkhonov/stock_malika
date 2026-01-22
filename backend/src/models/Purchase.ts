import { Schema, model } from "mongoose";

const purchaseItemSchema = new Schema(
  {
    productVariantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    quantity: { type: Number, required: true },
    unitCost: { type: Number, required: true }
  },
  { _id: true }
);

const purchaseSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    totalCost: { type: Number, required: true },
    paidNow: { type: Number, required: true },
    items: { type: [purchaseItemSchema], default: [] },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

purchaseSchema.index({ tenantId: 1, storeId: 1 });

export const Purchase = model("Purchase", purchaseSchema);
