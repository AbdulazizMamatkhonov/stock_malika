import { Response } from "express";
import { z } from "zod";
import { AuthedRequest } from "../middleware/auth";
import { Expense } from "../models/Expense";
import { AuditLog } from "../models/AuditLog";

const expenseSchema = z.object({
  storeId: z.string().uuid().or(z.string().length(24)).optional(),
  description: z.string().trim().min(3),
  amount: z.preprocess((value) => Number(value), z.number().positive())
});

const expenseQuerySchema = z.object({
  storeId: z.string().uuid().or(z.string().length(24)).optional()
});

export const listExpenses = async (req: AuthedRequest, res: Response) => {
  const parsed = expenseQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const filters: Record<string, string | undefined> = { tenantId: req.user?.tenantId };
  if (parsed.data.storeId) {
    filters.storeId = parsed.data.storeId;
  }

  const expenses = await Expense.find(filters)
    .sort({ createdAt: -1 })
    .lean();
  return res.json(expenses);
};

export const createExpense = async (req: AuthedRequest, res: Response) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const expense = await Expense.create({
    tenantId: req.user?.tenantId,
    storeId: parsed.data.storeId,
    description: parsed.data.description,
    amount: parsed.data.amount
  });

  await AuditLog.create({
    tenantId: req.user?.tenantId,
    userId: req.user?.id,
    action: "EXPENSE_CREATED",
    metadata: { expenseId: expense._id }
  });

  return res.status(201).json(expense);
};
