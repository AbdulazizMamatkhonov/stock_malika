import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { InventoryService } from "../services/inventoryService";
import { createSaleSchema } from "@shop/shared";
import { Sale } from "../models/Sale";
import { AuditLog } from "../models/AuditLog";

export const listSales = async (req: AuthedRequest, res: Response) => {
  const sales = await Sale.find({ tenantId: req.user?.tenantId })
    .sort({ createdAt: -1 })
    .lean();
  return res.json(sales);
};

export const createSale = async (req: AuthedRequest, res: Response) => {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

const service = new InventoryService();
  try {
    const sale = await service.createSale({
      tenantId: req.user?.tenantId as string,
      storeId: parsed.data.storeId,
      items: parsed.data.items
    });

  await AuditLog.create({
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      action: "SALE_CREATED",
      metadata: { saleId: sale._id }
    });

    return res.status(201).json(sale);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};
