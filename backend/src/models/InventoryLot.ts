import { Schema, model } from "mongoose";

const inventoryLotSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    productVariantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    purchaseItemId: { type: Schema.Types.ObjectId },
    quantityReceived: { type: Number, required: true },
    quantityRemaining: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    receivedAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

inventoryLotSchema.index({ tenantId: 1, storeId: 1, productVariantId: 1 });

export const InventoryLot = model("InventoryLot", inventoryLotSchema);
