import { z } from "zod";

export const roleEnum = z.enum(["MASTER", "OWNER", "MANAGER", "CASHIER", "VIEWER"]);
export const planEnum = z.enum(["FREE", "TRIAL", "PAID"]);
export const statusEnum = z.enum(["ACTIVE", "PAST_DUE", "CANCELED"]);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const createSaleSchema = z.object({
  storeId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productVariantId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative()
      })
    )
    .min(1)
});

export type Role = z.infer<typeof roleEnum>;
export type Plan = z.infer<typeof planEnum>;
export type SubscriptionStatus = z.infer<typeof statusEnum>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
