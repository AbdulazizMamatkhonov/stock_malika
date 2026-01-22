import { Response } from "express";
import { z } from "zod";
import { AuthedRequest } from "../middleware/auth";
import { InventoryService } from "../services/inventoryService";
import { Purchase } from "../models/Purchase";
import { AuditLog } from "../models/AuditLog";

const purchaseSchema = z.object({
  storeId: z.string().uuid().or(z.string().length(24)),
  supplierId: z.string().uuid().or(z.string().length(24)),
  paidNow: z.number().nonnegative(),
  items: z
    .array(
      z.object({
        productVariantId: z.string().uuid().or(z.string().length(24)),
        quantity: z.number().int().positive(),
        unitCost: z.number().positive()
      })
    )
    .min(1)
});

export const listPurchases = async (req: AuthedRequest, res: Response) => {
  const purchases = await Purchase.find({ tenantId: req.user?.tenantId })
    .sort({ createdAt: -1 })
    .lean();
  return res.json(purchases);
};

export const createPurchase = async (req: AuthedRequest, res: Response) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const service = new InventoryService();
  const purchase = await service.createPurchase({
    tenantId: req.user?.tenantId as string,
    storeId: parsed.data.storeId,
    supplierId: parsed.data.supplierId,
    items: parsed.data.items,
    paidNow: parsed.data.paidNow
  });

  await AuditLog.create({
    tenantId: req.user?.tenantId,
    userId: req.user?.id,
    action: "PURCHASE_CREATED",
    metadata: { purchaseId: purchase._id }
  });

  return res.status(201).json(purchase);
};
