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

const productUpdateSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    category: z.string().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });

const variantSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  attributes: z.record(z.string(), z.string()).optional()
});

const variantUpdateSchema = z
  .object({
    sku: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    attributes: z.record(z.string(), z.string()).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });

const getDuplicateSkus = (skus: string[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  skus.forEach((sku) => {
    if (seen.has(sku)) {
      duplicates.add(sku);
    }
    seen.add(sku);
  });
  return Array.from(duplicates);
};

const formatSkuConflict = (skus: string[]) =>
  `SKU already exists: ${skus.join(", ")}`;

const isDuplicateKeyError = (error: unknown) =>
  Boolean((error as { code?: number })?.code === 11000);

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

  const variantSkus = parsed.data.variants.map((variant) => variant.sku.trim());
  const duplicateSkus = getDuplicateSkus(variantSkus);
  if (duplicateSkus.length > 0) {
    return res.status(400).json({
      message: `Duplicate SKUs in request: ${duplicateSkus.join(", ")}`
    });
  }

  const existingVariants = await ProductVariant.find({
    tenantId: req.user?.tenantId,
    sku: { $in: variantSkus }
  }).lean();
  if (existingVariants.length > 0) {
    return res.status(409).json({
      message: formatSkuConflict(existingVariants.map((variant) => variant.sku))
    });
  }

  const product = await Product.create({
    tenantId: req.user?.tenantId,
    name: parsed.data.name,
    description: parsed.data.description,
    category: parsed.data.category
  });

  let variants;
  try {
    variants = await ProductVariant.insertMany(
      parsed.data.variants.map((variant) => ({
        tenantId: req.user?.tenantId,
        productId: product._id,
        sku: variant.sku,
        name: variant.name,
        attributes: variant.attributes || undefined
      }))
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      await Product.deleteOne({ _id: product._id });
      return res.status(409).json({ message: "SKU already exists." });
    }
    throw error;
  }

  return res.status(201).json({ ...product.toObject(), variants });
};

export const updateProduct = async (req: AuthedRequest, res: Response) => {
  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const productId = req.params.productId;
  const updateData: Record<string, string | undefined> = {};
  if (parsed.data.name !== undefined) {
    updateData.name = parsed.data.name;
  }
  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description;
  }
  if (parsed.data.category !== undefined) {
    updateData.category = parsed.data.category;
  }

  const product = await Product.findOneAndUpdate(
    { _id: productId, tenantId: req.user?.tenantId },
    { $set: updateData },
    { new: true }
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const variants = await ProductVariant.find({
    tenantId: req.user?.tenantId,
    productId: product._id
  }).lean();

  return res.json({ ...product.toObject(), variants });
};

export const deleteProduct = async (req: AuthedRequest, res: Response) => {
  const productId = req.params.productId;
  const product = await Product.findOneAndDelete({
    _id: productId,
    tenantId: req.user?.tenantId
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await ProductVariant.deleteMany({
    tenantId: req.user?.tenantId,
    productId: product._id
  });

  return res.json({ message: "Product deleted" });
};

export const createVariant = async (req: AuthedRequest, res: Response) => {
  const parsed = variantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const productId = req.params.productId;
  const product = await Product.findOne({
    _id: productId,
    tenantId: req.user?.tenantId
  }).lean();
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const existingVariant = await ProductVariant.findOne({
    tenantId: req.user?.tenantId,
    sku: parsed.data.sku.trim()
  }).lean();
  if (existingVariant) {
    return res.status(409).json({
      message: formatSkuConflict([existingVariant.sku])
    });
  }

  let variant;
  try {
    variant = await ProductVariant.create({
      tenantId: req.user?.tenantId,
      productId,
      sku: parsed.data.sku.trim(),
      name: parsed.data.name,
      attributes: parsed.data.attributes || undefined
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: "SKU already exists." });
    }
    throw error;
  }

  return res.status(201).json(variant);
};

export const updateVariant = async (req: AuthedRequest, res: Response) => {
  const parsed = variantUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const productId = req.params.productId;
  const variantId = req.params.variantId;

  const updateData: Record<string, unknown> = {};
  if (parsed.data.sku !== undefined) {
    updateData.sku = parsed.data.sku.trim();
  }
  if (parsed.data.name !== undefined) {
    updateData.name = parsed.data.name;
  }
  if (parsed.data.attributes !== undefined) {
    updateData.attributes = parsed.data.attributes;
  }

  if (parsed.data.sku) {
    const existingVariant = await ProductVariant.findOne({
      tenantId: req.user?.tenantId,
      sku: parsed.data.sku.trim(),
      _id: { $ne: variantId }
    }).lean();
    if (existingVariant) {
      return res.status(409).json({
        message: formatSkuConflict([existingVariant.sku])
      });
    }
  }

  let variant;
  try {
    variant = await ProductVariant.findOneAndUpdate(
      { _id: variantId, productId, tenantId: req.user?.tenantId },
      { $set: updateData },
      { new: true }
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: "SKU already exists." });
    }
    throw error;
  }

  if (!variant) {
    return res.status(404).json({ message: "Variant not found" });
  }

  return res.json(variant);
};

export const deleteVariant = async (req: AuthedRequest, res: Response) => {
  const productId = req.params.productId;
  const variantId = req.params.variantId;
  const variant = await ProductVariant.findOneAndDelete({
    _id: variantId,
    productId,
    tenantId: req.user?.tenantId
  });

  if (!variant) {
    return res.status(404).json({ message: "Variant not found" });
  }

  return res.json({ message: "Variant deleted" });
};
