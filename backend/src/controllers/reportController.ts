import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";

export const salesSummary = async (req: AuthedRequest, res: Response) => {
  const { startDate, endDate, storeId } = req.query as {
    startDate?: string;
    endDate?: string;
    storeId?: string;
  };

  const tenantId = req.user?.tenantId as string;

  const filters: string[] = ["\"tenantId\" = $1"];
  const values: Array<string | Date> = [tenantId];

  if (storeId) {
    filters.push(`\"storeId\" = $${values.length + 1}`);
    values.push(storeId);
  }

  if (startDate) {
    filters.push(`\"createdAt\" >= $${values.length + 1}`);
    values.push(new Date(startDate));
  }

  if (endDate) {
    filters.push(`\"createdAt\" <= $${values.length + 1}`);
    values.push(new Date(endDate));
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const revenueRows = await prisma.$queryRawUnsafe<
    Array<{
      day: string;
      revenue: number;
      cogs: number;
      salesCount: number;
    }>
  >(
    `SELECT DATE_TRUNC('day', "createdAt") AS day,
        SUM("totalRevenue")::float AS revenue,
        SUM("totalCogs")::float AS cogs,
        COUNT(*)::int AS "salesCount"
      FROM "Sale"
      ${whereClause}
      GROUP BY day
      ORDER BY day ASC`,
    ...values
  );

  const expenseRows = await prisma.$queryRawUnsafe<
    Array<{ day: string; expenses: number }>
  >(
    `SELECT DATE_TRUNC('day', "createdAt") AS day,
        SUM("amount")::float AS expenses
      FROM "Expense"
      ${whereClause}
      GROUP BY day
      ORDER BY day ASC`,
    ...values
  );

  return res.json({ revenueRows, expenseRows });
};
