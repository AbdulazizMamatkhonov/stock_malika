import { Schema, model } from "mongoose";

const supplierSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String }
  },
  { timestamps: true }
);

supplierSchema.index({ tenantId: 1, storeId: 1 });

export const Supplier = model("Supplier", supplierSchema);
