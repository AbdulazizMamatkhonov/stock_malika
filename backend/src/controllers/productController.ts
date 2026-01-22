import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { z } from "zod";

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
  const products = await prisma.product.findMany({
    where: { tenantId: req.user?.tenantId },
    include: { variants: true }
  });
  return res.json(products);
};

export const createProduct = async (req: AuthedRequest, res: Response) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const product = await prisma.product.create({
    data: {
      tenantId: req.user?.tenantId as string,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      variants: {
        create: parsed.data.variants.map((variant) => ({
          sku: variant.sku,
          name: variant.name,
          attributes: variant.attributes || undefined,
          tenantId: req.user?.tenantId as string
        }))
      }
    },
    include: { variants: true }
  });

  return res.status(201).json(product);
};
