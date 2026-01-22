import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { InventoryLot } from "../models/InventoryLot";

export const listInventory = async (req: AuthedRequest, res: Response) => {
  const { storeId } = req.query as { storeId?: string };

  const match: Record<string, unknown> = {
    tenantId: req.user?.tenantId
  };

  if (storeId) {
    match.storeId = storeId;
  }

  const inventory = await InventoryLot.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$productVariantId",
        quantityRemaining: { $sum: "$quantityRemaining" },
        avgUnitCost: { $avg: "$unitCost" }
      }
    },
    {
      $lookup: {
        from: "productvariants",
        localField: "_id",
        foreignField: "_id",
        as: "variant"
      }
    },
    { $unwind: "$variant" },
    {
      $lookup: {
        from: "products",
        localField: "variant.productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 0,
        productVariantId: "$variant._id",
        sku: "$variant.sku",
        variantName: "$variant.name",
        productName: "$product.name",
        quantityRemaining: 1,
        avgUnitCost: 1
      }
    },
    { $sort: { productName: 1 } }
  ]);

  return res.json(inventory);
};
