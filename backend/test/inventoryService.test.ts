import { InventoryService } from "../src/services/inventoryService";

const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn()
};

jest.mock("mongoose", () => ({
  startSession: jest.fn(async () => mockSession),
  Types: {
    ObjectId: class MockObjectId {
      toString() {
        return "mock-id";
      }
    }
  }
}));

const mockLots = [
  { _id: "lot-1", quantityRemaining: 5, unitCost: 2.5 },
  { _id: "lot-2", quantityRemaining: 10, unitCost: 3 }
];

const inventoryLotFind = jest.fn(() => ({
  sort: jest.fn(() => ({
    session: jest.fn(async () => mockLots)
  }))
}));

const inventoryLotUpdateOne = jest.fn();

jest.mock("../src/models/InventoryLot", () => ({
  InventoryLot: {
    find: (...args: unknown[]) => inventoryLotFind(...args),
    updateOne: (...args: unknown[]) => inventoryLotUpdateOne(...args),
    create: jest.fn()
  }
}));

const saleCreate = jest.fn(async () => [{ _id: "sale-1", items: [] }]);

jest.mock("../src/models/Sale", () => ({
  Sale: {
    create: (...args: unknown[]) => saleCreate(...args)
  }
}));

jest.mock("../src/models/Purchase", () => ({
  Purchase: {
    create: jest.fn()
  }
}));

describe("InventoryService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deducts inventory FIFO and calculates COGS", async () => {
    const service = new InventoryService();

    const result = await service.createSale({
      tenantId: "tenant-1",
      storeId: "store-1",
      items: [{ productVariantId: "variant-1", quantity: 7, unitPrice: 5 }]
    });

    expect(inventoryLotFind).toHaveBeenCalled();
    expect(inventoryLotUpdateOne).toHaveBeenCalledTimes(2);
    expect(saleCreate).toHaveBeenCalled();

    const createArgs = saleCreate.mock.calls[0][0][0];
    expect(createArgs.totalCogs).toBeCloseTo(2.5 * 5 + 3 * 2);
    expect(result).toEqual({ _id: "sale-1", items: [] });
  });

  it("rejects sale with insufficient stock", async () => {
    inventoryLotFind.mockImplementationOnce(() => ({
      sort: jest.fn(() => ({
        session: jest.fn(async () => [{ _id: "lot-1", quantityRemaining: 2, unitCost: 2.5 }])
      }))
    }));

    const service = new InventoryService();

    await expect(
      service.createSale({
        tenantId: "tenant-1",
        storeId: "store-1",
        items: [{ productVariantId: "variant-1", quantity: 5, unitPrice: 5 }]
      })
    ).rejects.toThrow("Insufficient stock");
  });
});
