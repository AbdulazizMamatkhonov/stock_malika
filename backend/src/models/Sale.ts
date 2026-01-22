import { Schema, model } from "mongoose";

const saleItemSchema = new Schema(
  {
    productVariantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    unitCost: { type: Number, required: true }
  },
  { _id: true }
);

const saleSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    totalRevenue: { type: Number, required: true },
    totalCogs: { type: Number, required: true },
    items: { type: [saleItemSchema], default: [] },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

saleSchema.index({ tenantId: 1, storeId: 1 });

export const Sale = model("Sale", saleSchema);
