import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { z } from "zod";

const storeSchema = z.object({
  name: z.string().min(2),
  isConnected: z.boolean().optional()
});

export const listStores = async (req: AuthedRequest, res: Response) => {
  const stores = await prisma.store.findMany({
    where: { tenantId: req.user?.tenantId }
  });
  return res.json(stores);
};

export const createStore = async (req: AuthedRequest, res: Response) => {
  const parsed = storeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const store = await prisma.store.create({
    data: {
      tenantId: req.user?.tenantId as string,
      name: parsed.data.name,
      isConnected: parsed.data.isConnected ?? true
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      action: "STORE_CREATED",
      metadata: { storeId: store.id }
    }
  });

  return res.status(201).json(store);
};
