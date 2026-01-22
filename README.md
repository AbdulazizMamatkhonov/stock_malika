# Shop Sales & Inventory

Production-ready multi-tenant sales + inventory platform with React, Express, Prisma, and PostgreSQL.

## Repo Structure

- `backend` – Express API, Prisma schema, migrations, tests
- `frontend` – React + MUI dashboard
- `shared` – shared types + validation schemas

## Features

- Multi-tenant isolation with roles (MASTER, OWNER, MANAGER, CASHIER, VIEWER)
- Subscription gating middleware for write access
- FIFO inventory lots with COGS calculation
- Supplier balances and expense tracking
- Audit logging for critical actions
- OpenAPI docs at `/docs`

## Local Setup

### 1) Start Postgres

```bash
docker-compose up -d
```

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

API available at `http://localhost:4000`.

### 3) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend available at `http://localhost:5173`.

## Demo Credentials (seeded)

| Role | Email | Password |
| --- | --- | --- |
| Master Admin | `master@platform.io` | `MasterAdmin123!` |
| Tenant Owner | `owner@demo.io` | `Owner123!` |
| Cashier | `cashier@demo.io` | `Cashier123!` |

## Sample API Requests

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.io","password":"Owner123!"}'
```

```bash
curl -X POST http://localhost:4000/sales \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"storeId":"<store-id>","items":[{"productVariantId":"<variant-id>","quantity":2,"unitPrice":12.5}]}'
```

## Notes

- Subscription gating blocks writes when status is not `ACTIVE`.
- Store-level inventory is isolated; shared catalog is enabled by default.
- Use the migration SQL in `backend/prisma/migrations` for initial schema.
