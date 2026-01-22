import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { InventoryService } from "../services/inventoryService";
import { createSaleSchema } from "@shop/shared";

export const listSales = async (req: AuthedRequest, res: Response) => {
  const sales = await prisma.sale.findMany({
    where: { tenantId: req.user?.tenantId },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });
  return res.json(sales);
};

export const createSale = async (req: AuthedRequest, res: Response) => {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const service = new InventoryService(prisma);
  try {
    const sale = await service.createSale({
      tenantId: req.user?.tenantId as string,
      storeId: parsed.data.storeId,
      items: parsed.data.items
    });

    await prisma.auditLog.create({
      data: {
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
        action: "SALE_CREATED",
        metadata: { saleId: sale.id }
      }
    });

    return res.status(201).json(sale);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};
