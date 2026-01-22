import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String }
  },
  { timestamps: true }
);

productSchema.index({ tenantId: 1, name: 1 });

export const Product = model("Product", productSchema);
