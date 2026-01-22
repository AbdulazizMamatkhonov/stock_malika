import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { z } from "zod";
import { Store } from "../models/Store";
import { AuditLog } from "../models/AuditLog";

const storeSchema = z.object({
  name: z.string().min(2),
  isConnected: z.boolean().optional()
});

export const listStores = async (req: AuthedRequest, res: Response) => {
  const stores = await Store.find({ tenantId: req.user?.tenantId }).lean();
  return res.json(stores);
};

export const createStore = async (req: AuthedRequest, res: Response) => {
  const parsed = storeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const store = await Store.create({
    tenantId: req.user?.tenantId,
    name: parsed.data.name,
    isConnected: parsed.data.isConnected ?? true
  });

  await AuditLog.create({
    tenantId: req.user?.tenantId,
    userId: req.user?.id,
    action: "STORE_CREATED",
    metadata: { storeId: store._id }
  });

  return res.status(201).json(store);
};
