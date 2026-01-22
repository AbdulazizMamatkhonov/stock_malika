import { Schema, model } from "mongoose";

const productVariantSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    attributes: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

productVariantSchema.index({ tenantId: 1, productId: 1 });

export const ProductVariant = model("ProductVariant", productVariantSchema);
