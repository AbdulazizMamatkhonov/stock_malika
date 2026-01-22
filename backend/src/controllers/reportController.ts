import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { Sale } from "../models/Sale";
import { Expense } from "../models/Expense";

const buildMatch = (tenantId: string, query: { startDate?: string; endDate?: string; storeId?: string }) => {
  const match: Record<string, unknown> = { tenantId };
  if (query.storeId) {
    match.storeId = query.storeId;
  }
  if (query.startDate || query.endDate) {
    match.createdAt = {};
    if (query.startDate) {
      (match.createdAt as Record<string, Date>).$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      (match.createdAt as Record<string, Date>).$lte = new Date(query.endDate);
    }
  }
  return match;
};

export const salesSummary = async (req: AuthedRequest, res: Response) => {
  const { startDate, endDate, storeId } = req.query as {
    startDate?: string;
    endDate?: string;
    storeId?: string;
  };

  const tenantId = req.user?.tenantId as string;
  const match = buildMatch(tenantId, { startDate, endDate, storeId });

  const revenueRows = await Sale.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateTrunc: { date: "$createdAt", unit: "day" }
        },
        revenue: { $sum: "$totalRevenue" },
        cogs: { $sum: "$totalCogs" },
        salesCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        day: "$_id",
        revenue: 1,
        cogs: 1,
        salesCount: 1
      }
    }
  ]);

  const expenseRows = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateTrunc: { date: "$createdAt", unit: "day" }
        },
        expenses: { $sum: "$amount" }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        day: "$_id",
        expenses: 1
      }
    }
  ]);

  return res.json({ revenueRows, expenseRows });
};
