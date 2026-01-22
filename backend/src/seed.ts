import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectMongo, mongoose } from "./lib/mongo";
import { User } from "./models/User";
import { Tenant } from "./models/Tenant";
import { Store } from "./models/Store";
import { Supplier } from "./models/Supplier";
import { Product } from "./models/Product";
import { ProductVariant } from "./models/ProductVariant";
import { InventoryLot } from "./models/InventoryLot";
import { AuditLog } from "./models/AuditLog";

dotenv.config();

async function main() {
  await connectMongo();

  const masterPassword = await bcrypt.hash("MasterAdmin123!", 10);
  const ownerPassword = await bcrypt.hash("Owner123!", 10);
  const cashierPassword = await bcrypt.hash("Cashier123!", 10);

  const master = await User.findOneAndUpdate(
    { email: "master@platform.io" },
    { email: "master@platform.io", passwordHash: masterPassword, role: "MASTER" },
    { upsert: true, new: true }
  );

  const tenant = await Tenant.findOneAndUpdate(
    { name: "Demo Tenant" },
    {
      name: "Demo Tenant",
      plan: "TRIAL",
      subscriptionStatus: "ACTIVE",
      subscriptionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    },
    { upsert: true, new: true }
  );

  const store = await Store.create({
    name: "Downtown Store",
    tenantId: tenant._id,
    isConnected: true
  });

  await User.findOneAndUpdate(
    { email: "owner@demo.io" },
    {
      email: "owner@demo.io",
      passwordHash: ownerPassword,
      role: "OWNER",
      tenantId: tenant._id
    },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { email: "cashier@demo.io" },
    {
      email: "cashier@demo.io",
      passwordHash: cashierPassword,
      role: "CASHIER",
      tenantId: tenant._id
    },
    { upsert: true }
  );

  const supplier = await Supplier.create({
    name: "Global Supplies",
    storeId: store._id,
    tenantId: tenant._id,
    phone: "+1-555-0101"
  });

  const product = await Product.create({
    name: "Arabica Coffee",
    category: "Beverages",
    tenantId: tenant._id
  });

  const variant = await ProductVariant.create({
    name: "Arabica 1kg",
    sku: "ARABICA-1KG",
    tenantId: tenant._id,
    productId: product._id,
    attributes: { size: "1kg" }
  });

  await InventoryLot.create({
    tenantId: tenant._id,
    storeId: store._id,
    productVariantId: variant._id,
    quantityReceived: 100,
    quantityRemaining: 100,
    unitCost: 8.5
  });

  await AuditLog.create({
    tenantId: tenant._id,
    userId: master._id,
    action: "USER_CREATED",
    metadata: { seeded: true, supplierId: supplier._id }
  });

  console.log("Seeded demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
