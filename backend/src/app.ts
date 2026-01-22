import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { login, refresh, logout } from "./controllers/authController";
import { listTenants, createTenant, updateTenant } from "./controllers/tenantController";
import { listStores, createStore } from "./controllers/storeController";
import { listUsers, createUser } from "./controllers/userController";
import { listProducts, createProduct } from "./controllers/productController";
import { listSuppliers, createSupplier, supplierHistory } from "./controllers/supplierController";
import { listPurchases, createPurchase } from "./controllers/purchaseController";
import { listSales, createSale } from "./controllers/saleController";
import { listExpenses, createExpense } from "./controllers/expenseController";
import { salesSummary } from "./controllers/reportController";
import { requireAuth, requireRole } from "./middleware/auth";
import { subscriptionGate } from "./middleware/subscription";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100
  });

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        url: "/openapi.yaml"
      }
    })
  );
  app.get("/openapi.yaml", (_req, res) => {
    res.sendFile(path.join(__dirname, "../openapi.yaml"));
  });

  app.post("/auth/login", authLimiter, login);
  app.post("/auth/refresh", authLimiter, refresh);
  app.post("/auth/logout", requireAuth, logout);

  app.use(requireAuth);
  app.use(subscriptionGate);

  app.get("/tenants", requireRole(["MASTER"]), listTenants);
  app.post("/tenants", requireRole(["MASTER"]), createTenant);
  app.patch("/tenants/:tenantId", requireRole(["MASTER"]), updateTenant);

  app.get("/stores", listStores);
  app.post("/stores", requireRole(["OWNER", "MANAGER"]), createStore);

  app.get("/users", requireRole(["OWNER", "MANAGER"]), listUsers);
  app.post("/users", requireRole(["OWNER"]), createUser);

  app.get("/products", listProducts);
  app.post("/products", requireRole(["OWNER", "MANAGER"]), createProduct);

  app.get("/suppliers", listSuppliers);
  app.post("/suppliers", requireRole(["OWNER", "MANAGER"]), createSupplier);
  app.get("/suppliers/:supplierId/history", supplierHistory);

  app.get("/purchases", listPurchases);
  app.post("/purchases", requireRole(["OWNER", "MANAGER"]), createPurchase);

  app.get("/sales", listSales);
  app.post(
    "/sales",
    requireRole(["OWNER", "MANAGER", "CASHIER"]),
    createSale
  );

  app.get("/expenses", listExpenses);
  app.post("/expenses", requireRole(["OWNER", "MANAGER"]), createExpense);

  app.get("/reports/sales", salesSummary);

  return app;
};
