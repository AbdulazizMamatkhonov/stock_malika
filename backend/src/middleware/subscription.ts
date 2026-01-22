import { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "./auth";

const writeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const subscriptionGate = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.tenantId || !writeMethods.has(req.method)) {
    return next();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: req.user.tenantId }
  });

  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  const isActive =
    tenant.subscriptionStatus === "ACTIVE" &&
    (!tenant.subscriptionExpiresAt ||
      tenant.subscriptionExpiresAt > new Date());

  if (!isActive) {
    return res
      .status(402)
      .json({ message: "Subscription inactive. Read-only access." });
  }

  return next();
};
