import { InventoryService } from "../src/services/inventoryService";
import { Prisma } from "@prisma/client";

type MockTx = {
  inventoryLot: {
    findMany: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };
  sale: {
    create: jest.Mock;
  };
  purchase: {
    create: jest.Mock;
  };
};

describe("InventoryService", () => {
  it("deducts inventory FIFO and calculates COGS", async () => {
    const tx: MockTx = {
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "lot-1",
            quantityRemaining: 5,
            unitCost: new Prisma.Decimal(2.5)
          },
          {
            id: "lot-2",
            quantityRemaining: 10,
            unitCost: new Prisma.Decimal(3)
          }
        ]),
        update: jest.fn(),
        create: jest.fn()
      },
      sale: {
        create: jest.fn().mockResolvedValue({ id: "sale-1", items: [] })
      },
      purchase: {
        create: jest.fn()
      }
    };

    const prisma = {
      $transaction: async (fn: (trx: MockTx) => Promise<unknown>) => fn(tx)
    } as unknown as { $transaction: (fn: (trx: MockTx) => Promise<unknown>) => Promise<unknown> };

    const service = new InventoryService(prisma as any);

    const result = await service.createSale({
      tenantId: "tenant-1",
      storeId: "store-1",
      items: [
        { productVariantId: "variant-1", quantity: 7, unitPrice: 5 }
      ]
    });

    expect(tx.inventoryLot.update).toHaveBeenCalledTimes(2);
    expect(tx.sale.create).toHaveBeenCalled();
    const createArgs = tx.sale.create.mock.calls[0][0];
    expect(createArgs.data.totalCogs).toEqual(new Prisma.Decimal(2.5 * 5 + 3 * 2));
    expect(result).toEqual({ id: "sale-1", items: [] });
  });

  it("rejects sale with insufficient stock", async () => {
    const tx: MockTx = {
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "lot-1",
            quantityRemaining: 2,
            unitCost: new Prisma.Decimal(2.5)
          }
        ]),
        update: jest.fn(),
        create: jest.fn()
      },
      sale: {
        create: jest.fn()
      },
      purchase: {
        create: jest.fn()
      }
    };

    const prisma = {
      $transaction: async (fn: (trx: MockTx) => Promise<unknown>) => fn(tx)
    } as unknown as { $transaction: (fn: (trx: MockTx) => Promise<unknown>) => Promise<unknown> };

    const service = new InventoryService(prisma as any);

    await expect(
      service.createSale({
        tenantId: "tenant-1",
        storeId: "store-1",
        items: [
          { productVariantId: "variant-1", quantity: 5, unitPrice: 5 }
        ]
      })
    ).rejects.toThrow("Insufficient stock");
  });
});
