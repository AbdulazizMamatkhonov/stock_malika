import { Schema, model } from "mongoose";

const storeSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    isConnected: { type: Boolean, default: true }
  },
  { timestamps: true }
);

storeSchema.index({ tenantId: 1 });

export const Store = model("Store", storeSchema);
