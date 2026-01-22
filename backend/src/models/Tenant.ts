import { Schema, model } from "mongoose";

export type TenantPlan = "FREE" | "TRIAL" | "PAID";
export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED";

const tenantSchema = new Schema(
  {
    name: { type: String, required: true },
    plan: { type: String, enum: ["FREE", "TRIAL", "PAID"], default: "TRIAL" },
    subscriptionStatus: {
      type: String,
      enum: ["ACTIVE", "PAST_DUE", "CANCELED"],
      default: "ACTIVE"
    },
    subscriptionExpiresAt: { type: Date },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String }
  },
  { timestamps: true }
);

tenantSchema.index({ subscriptionStatus: 1, plan: 1 });

export const Tenant = model("Tenant", tenantSchema);
