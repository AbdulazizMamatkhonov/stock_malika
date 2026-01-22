import { Schema, model } from "mongoose";

const auditLogSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    userId: { type: Schema.Types.ObjectId },
    action: {
      type: String,
      enum: [
        "USER_CREATED",
        "USER_ROLE_CHANGED",
        "STORE_CREATED",
        "PURCHASE_CREATED",
        "SALE_CREATED",
        "SUPPLIER_PAYMENT",
        "EXPENSE_CREATED"
      ],
      required: true
    },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = model("AuditLog", auditLogSchema);
