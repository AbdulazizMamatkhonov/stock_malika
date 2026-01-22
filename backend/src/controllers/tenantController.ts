import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { z } from "zod";

const tenantSchema = z.object({
  name: z.string().min(2),
  plan: z.enum(["FREE", "TRIAL", "PAID"]).optional(),
  subscriptionStatus: z.enum(["ACTIVE", "PAST_DUE", "CANCELED"]).optional(),
  subscriptionExpiresAt: z.string().datetime().optional()
});

export const listTenants = async (_req: Request, res: Response) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" }
  });
  return res.json(tenants);
};

export const createTenant = async (req: AuthedRequest, res: Response) => {
  const parsed = tenantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: parsed.data.name,
      plan: parsed.data.plan || "TRIAL",
      subscriptionStatus: parsed.data.subscriptionStatus || "ACTIVE",
      subscriptionExpiresAt: parsed.data.subscriptionExpiresAt
        ? new Date(parsed.data.subscriptionExpiresAt)
        : null
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: req.user?.id,
      action: "STORE_CREATED",
      metadata: { createdByMaster: true }
    }
  });

  return res.status(201).json(tenant);
};

export const updateTenant = async (req: Request, res: Response) => {
  const parsed = tenantSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const tenant = await prisma.tenant.update({
    where: { id: req.params.tenantId },
    data: {
      ...parsed.data,
      subscriptionExpiresAt: parsed.data.subscriptionExpiresAt
        ? new Date(parsed.data.subscriptionExpiresAt)
        : undefined
    }
  });

  return res.json(tenant);
};
