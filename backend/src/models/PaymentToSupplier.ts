import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

paymentSchema.index({ tenantId: 1, storeId: 1 });

export const PaymentToSupplier = model("PaymentToSupplier", paymentSchema);
