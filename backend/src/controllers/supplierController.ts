import { Response } from "express";
import { z } from "zod";
import { AuthedRequest } from "../middleware/auth";
import { Supplier } from "../models/Supplier";
import { Purchase } from "../models/Purchase";
import { PaymentToSupplier } from "../models/PaymentToSupplier";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
};

const supplierSchema = z.object({
  storeId: z.string().uuid().or(z.string().length(24)),
  name: z.string().trim().min(2),
  phone: z.preprocess(emptyStringToUndefined, z.string().optional()),
  email: z.preprocess(emptyStringToUndefined, z.string().email().optional())
});

export const listSuppliers = async (req: AuthedRequest, res: Response) => {
  const suppliers = await Supplier.find({ tenantId: req.user?.tenantId }).lean();

  const supplierIds = suppliers.map((supplier) => supplier._id);
  const purchases = await Purchase.find({
    tenantId: req.user?.tenantId,
    supplierId: { $in: supplierIds }
  }).lean();
  const payments = await PaymentToSupplier.find({
    tenantId: req.user?.tenantId,
    supplierId: { $in: supplierIds }
  }).lean();

  const results = suppliers.map((supplier) => {
    const totalPurchases = purchases
      .filter((purchase) => purchase.supplierId.toString() === supplier._id.toString())
      .reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalPayments = payments
      .filter((payment) => payment.supplierId.toString() === supplier._id.toString())
      .reduce((sum, payment) => sum + payment.amount, 0);
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
    return res.status(400).json({
      message: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors
    });
  }

  const supplier = await Supplier.create({
    tenantId: req.user?.tenantId,
    storeId: parsed.data.storeId,
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email
  });

  return res.status(201).json(supplier);
};

export const supplierHistory = async (req: AuthedRequest, res: Response) => {
  const supplierId = req.params.supplierId;
  const [purchases, payments] = await Promise.all([
    Purchase.find({ supplierId, tenantId: req.user?.tenantId })
      .sort({ createdAt: -1 })
      .lean(),
    PaymentToSupplier.find({ supplierId, tenantId: req.user?.tenantId })
      .sort({ paidAt: -1 })
      .lean()
  ]);

  return res.json({ purchases, payments });
};
