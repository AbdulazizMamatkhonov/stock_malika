import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { z } from "zod";

const expenseSchema = z.object({
  storeId: z.string().uuid().optional(),
  description: z.string().min(3),
  amount: z.number().positive()
});

export const listExpenses = async (req: AuthedRequest, res: Response) => {
  const expenses = await prisma.expense.findMany({
    where: { tenantId: req.user?.tenantId },
    orderBy: { createdAt: "desc" }
  });
  return res.json(expenses);
};

export const createExpense = async (req: AuthedRequest, res: Response) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const expense = await prisma.expense.create({
    data: {
      tenantId: req.user?.tenantId as string,
      storeId: parsed.data.storeId,
      description: parsed.data.description,
      amount: parsed.data.amount
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      action: "EXPENSE_CREATED",
      metadata: { expenseId: expense.id }
    }
  });

  return res.status(201).json(expense);
};
