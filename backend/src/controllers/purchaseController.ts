import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { InventoryService } from "../services/inventoryService";

const purchaseSchema = z.object({
  storeId: z.string().uuid(),
  supplierId: z.string().uuid(),
  paidNow: z.number().nonnegative(),
  items: z
    .array(
      z.object({
        productVariantId: z.string().uuid(),
        quantity: z.number().int().positive(),
        unitCost: z.number().positive()
      })
    )
    .min(1)
});

export const listPurchases = async (req: AuthedRequest, res: Response) => {
  const purchases = await prisma.purchase.findMany({
    where: { tenantId: req.user?.tenantId },
    include: { items: true, supplier: true },
    orderBy: { createdAt: "desc" }
  });
  return res.json(purchases);
};

export const createPurchase = async (req: AuthedRequest, res: Response) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const service = new InventoryService(prisma);
  const purchase = await service.createPurchase({
    tenantId: req.user?.tenantId as string,
    storeId: parsed.data.storeId,
    supplierId: parsed.data.supplierId,
    items: parsed.data.items,
    paidNow: parsed.data.paidNow
  });

  await prisma.auditLog.create({
    data: {
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      action: "PURCHASE_CREATED",
      metadata: { purchaseId: purchase.id }
    }
  });

  return res.status(201).json(purchase);
};
