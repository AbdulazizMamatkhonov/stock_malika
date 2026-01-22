import { Types, startSession } from "mongoose";
import { InventoryLot } from "../models/InventoryLot";
import { Purchase } from "../models/Purchase";
import { Sale } from "../models/Sale";

export class InventoryService {
  async createPurchase(input: {
    tenantId: string;
    storeId: string;
    supplierId: string;
    items: Array<{ productVariantId: string; quantity: number; unitCost: number }>;
    paidNow: number;
  }) {
    const totalCost = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );

    const session = await startSession();
    session.startTransaction();

    try {
      const purchaseItems = input.items.map((item) => ({
        _id: new Types.ObjectId(),
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        unitCost: item.unitCost
      }));

      const [purchase] = await Purchase.create(
        [
          {
            tenantId: input.tenantId,
            storeId: input.storeId,
            supplierId: input.supplierId,
            totalCost,
            paidNow: input.paidNow,
            items: purchaseItems
          }
        ],
        { session }
      );

      for (const item of purchaseItems) {
        await InventoryLot.create(
          [
            {
              tenantId: input.tenantId,
              storeId: input.storeId,
              productVariantId: item.productVariantId,
              purchaseItemId: item._id,
              quantityReceived: item.quantity,
              quantityRemaining: item.quantity,
              unitCost: item.unitCost
            }
          ],
          { session }
        );
      }

      await session.commitTransaction();
      return purchase;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async createSale(input: {
    tenantId: string;
    storeId: string;
    items: Array<{ productVariantId: string; quantity: number; unitPrice: number }>;
  }) {
    const session = await startSession();
    session.startTransaction();

    try {
      const saleItems: Array<{
        productVariantId: string;
        quantity: number;
        unitPrice: number;
        unitCost: number;
      }> = [];

      let totalRevenue = 0;
      let totalCogs = 0;

      for (const item of input.items) {
        let remaining = item.quantity;
        const lots = await InventoryLot.find({
          tenantId: input.tenantId,
          storeId: input.storeId,
          productVariantId: item.productVariantId,
          quantityRemaining: { $gt: 0 }
        })
          .sort({ receivedAt: 1 })
          .session(session);

        const available = lots.reduce(
          (sum, lot) => sum + lot.quantityRemaining,
          0
        );

        if (available < remaining) {
          throw new Error("Insufficient stock for sale item.");
        }

        for (const lot of lots) {
          if (remaining === 0) {
            break;
          }
          const deduction = Math.min(remaining, lot.quantityRemaining);
          remaining -= deduction;

          await InventoryLot.updateOne(
            { _id: lot._id },
            { $inc: { quantityRemaining: -deduction } },
            { session }
          );

          saleItems.push({
            productVariantId: item.productVariantId,
            quantity: deduction,
            unitPrice: item.unitPrice,
            unitCost: lot.unitCost
          });

          totalCogs += deduction * lot.unitCost;
        }

        totalRevenue += item.quantity * item.unitPrice;
      }

      const [sale] = await Sale.create(
        [
          {
            tenantId: input.tenantId,
            storeId: input.storeId,
            totalRevenue,
            totalCogs,
            items: saleItems
          }
        ],
        { session }
      );

      await session.commitTransaction();
      return sale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
