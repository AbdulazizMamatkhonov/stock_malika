import { PrismaClient, Role, Plan, SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const masterPassword = await bcrypt.hash("MasterAdmin123!", 10);
  const ownerPassword = await bcrypt.hash("Owner123!", 10);
  const cashierPassword = await bcrypt.hash("Cashier123!", 10);

  const master = await prisma.user.upsert({
    where: { email: "master@platform.io" },
    update: {},
    create: {
      email: "master@platform.io",
      passwordHash: masterPassword,
      role: Role.MASTER
    }
  });

  const tenant = await prisma.tenant.upsert({
    where: { name: "Demo Tenant" },
    update: {},
    create: {
      name: "Demo Tenant",
      plan: Plan.TRIAL,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  });

  const store = await prisma.store.create({
    data: {
      name: "Downtown Store",
      tenantId: tenant.id,
      isConnected: true
    }
  });

  await prisma.user.upsert({
    where: { email: "owner@demo.io" },
    update: {},
    create: {
      email: "owner@demo.io",
      passwordHash: ownerPassword,
      role: Role.OWNER,
      tenantId: tenant.id
    }
  });

  await prisma.user.upsert({
    where: { email: "cashier@demo.io" },
    update: {},
    create: {
      email: "cashier@demo.io",
      passwordHash: cashierPassword,
      role: Role.CASHIER,
      tenantId: tenant.id
    }
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: "Global Supplies",
      storeId: store.id,
      tenantId: tenant.id,
      phone: "+1-555-0101"
    }
  });

  const product = await prisma.product.create({
    data: {
      name: "Arabica Coffee",
      category: "Beverages",
      tenantId: tenant.id
    }
  });

  const variant = await prisma.productVariant.create({
    data: {
      name: "Arabica 1kg",
      sku: "ARABICA-1KG",
      tenantId: tenant.id,
      productId: product.id,
      attributes: { size: "1kg" }
    }
  });

  await prisma.inventoryLot.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      productVariantId: variant.id,
      quantityReceived: 100,
      quantityRemaining: 100,
      unitCost: 8.5
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: master.id,
      action: "USER_CREATED",
      metadata: { seeded: true }
    }
  });

  console.log("Seeded demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
