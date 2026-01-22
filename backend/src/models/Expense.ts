import { Schema, model } from "mongoose";

const expenseSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store" },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

expenseSchema.index({ tenantId: 1, storeId: 1 });

export const Expense = model("Expense", expenseSchema);
