import { Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "VIEWER"])
});

export const listUsers = async (req: AuthedRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { tenantId: req.user?.tenantId }
  });
  return res.json(users);
};

export const createUser = async (req: AuthedRequest, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      tenantId: req.user?.tenantId as string
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      action: "USER_CREATED",
      metadata: { createdUserId: user.id }
    }
  });

  return res.status(201).json(user);
};
