CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Role" AS ENUM ('MASTER', 'OWNER', 'MANAGER', 'CASHIER', 'VIEWER');
CREATE TYPE "Plan" AS ENUM ('FREE', 'TRIAL', 'PAID');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED');
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'USER_ROLE_CHANGED', 'STORE_CREATED', 'PURCHASE_CREATED', 'SALE_CREATED', 'SUPPLIER_PAYMENT', 'EXPENSE_CREATED');

CREATE TABLE "Tenant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "plan" "Plan" NOT NULL DEFAULT 'TRIAL',
  "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "subscriptionExpiresAt" TIMESTAMP,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT
);

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "tenantId" UUID REFERENCES "Tenant"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Store" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "isConnected" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Supplier" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "storeId" UUID NOT NULL REFERENCES "Store"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Product" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "ProductVariant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "sku" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "attributes" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Purchase" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "storeId" UUID NOT NULL REFERENCES "Store"("id") ON DELETE CASCADE,
  "supplierId" UUID NOT NULL REFERENCES "Supplier"("id") ON DELETE CASCADE,
  "totalCost" NUMERIC(12,2) NOT NULL,
  "paidNow" NUMERIC(12,2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "PurchaseItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "purchaseId" UUID NOT NULL REFERENCES "Purchase"("id") ON DELETE CASCADE,
  "productVariantId" UUID NOT NULL REFERENCES "ProductVariant"("id") ON DELETE CASCADE,
  "quantity" INT NOT NULL,
  "unitCost" NUMERIC(12,2) NOT NULL
);

CREATE TABLE "InventoryLot" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "storeId" UUID NOT NULL REFERENCES "Store"("id") ON DELETE CASCADE,
  "productVariantId" UUID NOT NULL REFERENCES "ProductVariant"("id") ON DELETE CASCADE,
  "purchaseItemId" UUID REFERENCES "PurchaseItem"("id") ON DELETE SET NULL,
  "quantityReceived" INT NOT NULL,
  "quantityRemaining" INT NOT NULL,
  "unitCost" NUMERIC(12,2) NOT NULL,
  "receivedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Sale" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "storeId" UUID NOT NULL REFERENCES "Store"("id") ON DELETE CASCADE,
  "totalRevenue" NUMERIC(12,2) NOT NULL,
  "totalCogs" NUMERIC(12,2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "SaleItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "saleId" UUID NOT NULL REFERENCES "Sale"("id") ON DELETE CASCADE,
  "productVariantId" UUID NOT NULL REFERENCES "ProductVariant"("id") ON DELETE CASCADE,
  "quantity" INT NOT NULL,
  "unitPrice" NUMERIC(12,2) NOT NULL,
  "unitCost" NUMERIC(12,2) NOT NULL
);

CREATE TABLE "Expense" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "storeId" UUID REFERENCES "Store"("id") ON DELETE SET NULL,
  "description" TEXT NOT NULL,
  "amount" NUMERIC(12,2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "PaymentToSupplier" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "storeId" UUID NOT NULL REFERENCES "Store"("id") ON DELETE CASCADE,
  "supplierId" UUID NOT NULL REFERENCES "Supplier"("id") ON DELETE CASCADE,
  "amount" NUMERIC(12,2) NOT NULL,
  "paidAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID REFERENCES "Tenant"("id") ON DELETE SET NULL,
  "userId" UUID,
  "action" "AuditAction" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "Tenant_subscriptionStatus_plan_idx" ON "Tenant"("subscriptionStatus", "plan");
CREATE INDEX "Store_tenantId_idx" ON "Store"("tenantId");
CREATE INDEX "Supplier_tenantId_storeId_idx" ON "Supplier"("tenantId", "storeId");
CREATE INDEX "Product_tenantId_name_idx" ON "Product"("tenantId", "name");
CREATE INDEX "ProductVariant_tenantId_productId_idx" ON "ProductVariant"("tenantId", "productId");
CREATE INDEX "InventoryLot_tenantId_storeId_productVariantId_idx" ON "InventoryLot"("tenantId", "storeId", "productVariantId");
CREATE INDEX "Purchase_tenantId_storeId_idx" ON "Purchase"("tenantId", "storeId");
CREATE INDEX "Sale_tenantId_storeId_idx" ON "Sale"("tenantId", "storeId");
CREATE INDEX "Expense_tenantId_storeId_idx" ON "Expense"("tenantId", "storeId");
CREATE INDEX "PaymentToSupplier_tenantId_storeId_idx" ON "PaymentToSupplier"("tenantId", "storeId");
