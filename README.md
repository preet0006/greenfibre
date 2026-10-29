# GreenFibre

Production website: [https://www.greenfibre.org/](https://www.greenfibre.org/)  
Admin panel: [https://admin.greenfibre.org/](https://admin.greenfibre.org/)  
API: [https://api.greenfibre.org/](https://api.greenfibre.org/)

Eco-friendly e-commerce platform with a public storefront, admin dashboard, and Express/MongoDB API.

## Technology stack

| Layer | Stack |
|-------|--------|
| Storefront | Next.js (App Router), React, Zustand, Tailwind/shadcn-style UI |
| Admin | Next.js (App Router), React, Zustand |
| Backend API | Node.js, Express, Mongoose |
| Database | MongoDB 7 |
| Media | MinIO (S3-compatible) + Imgproxy |
| Payments | Easebuzz |
| Email | Nodemailer + Gmail (`USER_EMAIL` / `USER_PASS`) |
| Shipping | NimbusPost (optional) |
| Process manager (prod) | PM2 |
| Local infra | Docker Compose (`src/docker`) |

## Repository layout

```text
GreenFibre/
├── src/
│   ├── backend/          # Express API
│   ├── frontend/
│   │   ├── main/         # Public website
│   │   └── admin/        # Admin panel
│   └── docker/           # MongoDB + MinIO + Imgproxy
├── README.md
├── .gitignore
└── *.md                  # Handover / security notes (no secrets)
```

## Prerequisites

- Node.js 20+ recommended
- npm
- Docker Desktop (for Mongo/MinIO/Imgproxy locally)
- Git

## Environment setup (important)

**Never commit real `.env` files.**

1. Copy examples:

```bash
cp src/backend/.env.example src/backend/.env
cp src/docker/.env.example src/docker/.env
cp src/frontend/main/.env.example src/frontend/main/.env.local
cp src/frontend/admin/.env.example src/frontend/admin/.env.local
```

2. Fill private values in those local files (passwords, JWT, payment keys, SMTP app password, etc.).

3. Keep production secrets in a password manager / secure channel — not in GitHub.

### Required backend variables (names only)

- `MONGO_URL`
- `JWT_SECRET`
- `CLIENT_ORIGIN`, `ADMIN_ORIGIN`, `FRONTEND_URL`, `COOKIE_DOMAIN`
- `USER_EMAIL`, `USER_PASS` (Gmail app password)
- `MINIO_BASE_URL`, `MINIO_PUBLIC_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
- `IMGPROXY_URL`, `IMGPROXY_KEY`, `IMGPROXY_SALT`
- `EASEBUZZ_KEY`, `EASEBUZZ_SALT`, `EASEBUZZ_ENV`
- Optional: `CLOUDINARY_*`, `NIMBUSPOST_*`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `COMPANY_*`, warehouse fields

### Frontend variables

- `NEXT_PUBLIC_API_URL` — API base without `/api` suffix in some setups; this project expects the API host (see each `.env.example`)

## Local run (high level)

### 1) Start Docker services

```bash
cd src/docker
# ensure src/docker/.env exists (from .env.example)
docker compose up -d
```

### 2) Backend

```bash
cd src/backend
npm install
npm run dev
# default API port: 5500
```

### 3) Storefront

```bash
cd src/frontend/main
npm install
npm run dev
# typically http://localhost:3000
```

### 4) Admin

```bash
cd src/frontend/admin
npm install
npm run dev
# typically http://localhost:3001
```

## Database

- Technology: **MongoDB**
- Connection: `MONGO_URL` in backend `.env`
- Do **not** commit database dumps, user exports, OTPs, or order data

Seed admin (optional, requires `ADMIN_EMAIL` / `ADMIN_PASSWORD` in backend `.env`):

```bash
cd src/backend
node src/scripts/seedAdmin.js
```

## Build (production-style)

```bash
cd src/frontend/main && npm run build && npm run start
cd src/frontend/admin && npm run build && npm run start
cd src/backend && npm start
```

## Deployment notes

Production historically runs on a VPS with:

- Nginx reverse proxy for `www`, `admin`, `api`, `media`
- PM2 processes for API + Next apps
- Docker for MongoDB / MinIO / Imgproxy on localhost-bound ports

Exact server credentials and live `.env` values are **out of band** — not in this repository.

## Security notes

- Real `.env` files are gitignored
- Do not paste SMTP, payment, DB, or JWT secrets into issues/PRs
- Rotate credentials after handover (see `SECURITY_CREDENTIAL_ROTATION.md`)
- Email mailbox ownership must be transferred via Google / provider settings (see `EMAIL_HANDOVER_NOTE.md`)

## Channel Stock Management (B2B / B2C)

GreenFibre isolates retail (B2C & mobile) and wholesale (B2B) inventory pools while ensuring that `b2bStock + b2cStock <= physicalStock` at all times.

### Migration Script
Backfills channel stock from PostgreSQL Neon allocation rules (or 100% B2C default):
```bash
# Dry run (simulates changes without database writes)
node src/scripts/migrate-channel-stock.js --dry-run

# Live execution (idempotent bulkWrite batches of 500)
node src/scripts/migrate-channel-stock.js
```

### Admin Endpoints

#### 1. Batch / Single Stock Allocation Update
- **Method & Route**: `PUT /api/admin/stock/channel`
- **Auth**: Admin authentication token (`adminAuthMiddleware`)
- **Headers**: `Content-Type: application/json`

**Single Product Request Body:**
```json
{
  "productId": "6abb7adb3b3433817a2a5dbb",
  "b2bStock": 80,
  "b2cStock": 20
}
```

**Multi-Product Request Body (with SKU / ID and modes):**
```json
{
  "mode": "set",
  "items": [
    {
      "sku": "GF-FAMILY-PACK",
      "b2bStock": 100,
      "b2cStock": 250
    },
    {
      "productId": "6abb9ea741c3bdffa53c2df3",
      "b2bStock": 40,
      "b2cStock": 80
    }
  ]
}
```

**Response (HTTP 200 / 207 / 400):**
```json
{
  "success": true,
  "summary": {
    "total": 2,
    "updated": 2,
    "failed": 0
  },
  "results": [
    {
      "sku": "GF-FAMILY-PACK",
      "productId": "6abb7adb3b3433817a2a5dbb",
      "status": "updated",
      "b2bStock": 100,
      "b2cStock": 250
    },
    {
      "sku": "GF-DESK-SET",
      "productId": "6abb9ea741c3bdffa53c2df3",
      "status": "updated",
      "b2bStock": 40,
      "b2cStock": 80
    }
  ]
}
```

#### 2. Inventory Channel Table
- **Method & Route**: `GET /api/admin/stock/channel?search=&page=1&limit=20`
- **Auth**: Admin authentication token (`adminAuthMiddleware`)
- **Query Params**:
  - `search` (optional): Filter by SKU or product name
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Page size (default: 20, max: 100)

**Response (HTTP 200):**
```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 21,
    "pages": 2
  },
  "inventory": [
    {
      "id": "6abb7adb3b3433817a2a5dbb",
      "sku": "GF-FAMILY-PACK",
      "name": "Eco Green Fibre Family Pack",
      "warehouse": "Central Facility",
      "physicalStock": 100,
      "b2bStock": 80,
      "b2cStock": 20
    }
  ]
}
```

## License / ownership

Prepared for client handover of the GreenFibre production application source.
