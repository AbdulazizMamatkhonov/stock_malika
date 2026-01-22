import { Prisma, PrismaClient } from "@prisma/client";

export class InventoryService {
  constructor(private prisma: PrismaClient) {}

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

    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          tenantId: input.tenantId,
          storeId: input.storeId,
          supplierId: input.supplierId,
          totalCost,
          paidNow: input.paidNow,
          items: {
            create: input.items.map((item) => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              unitCost: new Prisma.Decimal(item.unitCost)
            }))
          }
        },
        include: { items: true }
      });

      for (const item of purchase.items) {
        await tx.inventoryLot.create({
          data: {
            tenantId: input.tenantId,
            storeId: input.storeId,
            productVariantId: item.productVariantId,
            purchaseItemId: item.id,
            quantityReceived: item.quantity,
            quantityRemaining: item.quantity,
            unitCost: item.unitCost
          }
        });
      }

      return purchase;
    });
  }

  async createSale(input: {
    tenantId: string;
    storeId: string;
    items: Array<{ productVariantId: string; quantity: number; unitPrice: number }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const saleItems: Array<{
        productVariantId: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        unitCost: Prisma.Decimal;
      }> = [];

      let totalRevenue = 0;
      let totalCogs = 0;

      for (const item of input.items) {
        let remaining = item.quantity;
        const lots = await tx.inventoryLot.findMany({
          where: {
            tenantId: input.tenantId,
            storeId: input.storeId,
            productVariantId: item.productVariantId,
            quantityRemaining: { gt: 0 }
          },
          orderBy: { receivedAt: "asc" }
        });

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
          const unitCost = lot.unitCost;

          await tx.inventoryLot.update({
            where: { id: lot.id },
            data: {
              quantityRemaining: lot.quantityRemaining - deduction
            }
          });

          saleItems.push({
            productVariantId: item.productVariantId,
            quantity: deduction,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            unitCost
          });

          totalCogs += deduction * Number(unitCost);
        }

        totalRevenue += item.quantity * item.unitPrice;
      }

      const sale = await tx.sale.create({
        data: {
          tenantId: input.tenantId,
          storeId: input.storeId,
          totalRevenue: new Prisma.Decimal(totalRevenue),
          totalCogs: new Prisma.Decimal(totalCogs),
          items: {
            create: saleItems.map((saleItem) => ({
              productVariantId: saleItem.productVariantId,
              quantity: saleItem.quantity,
              unitPrice: saleItem.unitPrice,
              unitCost: saleItem.unitCost
            }))
          }
        },
        include: { items: true }
      });

      return sale;
    });
  }
}
