import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { z } from "zod";

const supplierSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional()
});

export const listSuppliers = async (req: AuthedRequest, res: Response) => {
  const suppliers = await prisma.supplier.findMany({
    where: { tenantId: req.user?.tenantId },
    include: {
      purchases: true,
      payments: true
    }
  });

  const results = suppliers.map((supplier) => {
    const totalPurchases = supplier.purchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalCost),
      0
    );
    const totalPayments = supplier.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    return {
      ...supplier,
      balance: totalPurchases - totalPayments
    };
  });

  return res.json(results);
};

export const createSupplier = async (req: AuthedRequest, res: Response) => {
  const parsed = supplierSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const supplier = await prisma.supplier.create({
    data: {
      tenantId: req.user?.tenantId as string,
      storeId: parsed.data.storeId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email
    }
  });

  return res.status(201).json(supplier);
};

export const supplierHistory = async (req: AuthedRequest, res: Response) => {
  const supplierId = req.params.supplierId;
  const [purchases, payments] = await Promise.all([
    prisma.purchase.findMany({
      where: { supplierId, tenantId: req.user?.tenantId },
      orderBy: { createdAt: "desc" }
    }),
    prisma.paymentToSupplier.findMany({
      where: { supplierId, tenantId: req.user?.tenantId },
      orderBy: { paidAt: "desc" }
    })
  ]);

  return res.json({ purchases, payments });
};
