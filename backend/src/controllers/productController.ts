import { Response } from "express";
import { z } from "zod";
import { AuthedRequest } from "../middleware/auth";
import { Product } from "../models/Product";
import { ProductVariant } from "../models/ProductVariant";

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().min(2),
        name: z.string().min(2),
        attributes: z.record(z.string(), z.string()).optional()
      })
    )
    .min(1)
});

export const listProducts = async (req: AuthedRequest, res: Response) => {
  const products = await Product.find({ tenantId: req.user?.tenantId }).lean();
  const variants = await ProductVariant.find({ tenantId: req.user?.tenantId }).lean();

  const results = products.map((product) => ({
    ...product,
    variants: variants.filter(
      (variant) => variant.productId.toString() === product._id.toString()
    )
  }));

  return res.json(results);
};

export const createProduct = async (req: AuthedRequest, res: Response) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const product = await Product.create({
    tenantId: req.user?.tenantId,
    name: parsed.data.name,
    description: parsed.data.description,
    category: parsed.data.category
  });

  const variants = await ProductVariant.insertMany(
    parsed.data.variants.map((variant) => ({
      tenantId: req.user?.tenantId,
      productId: product._id,
      sku: variant.sku,
      name: variant.name,
      attributes: variant.attributes || undefined
    }))
  );

  return res.status(201).json({ ...product.toObject(), variants });
};
