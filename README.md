# 💍 Tat Vivah — Multi-Vendor E-commerce Platform

Tat Vivah is a full-stack, multi-vendor commerce platform focused on wedding apparel and accessories.
This repository contains:

- `backend` — Express + Prisma API with payments, orders, shipping, notifications, reviews, and admin workflows
- `frontend` — Next.js web app for buyers, sellers, and admins
- `mobile` — Expo React Native app

---

## ✅ Latest Implemented Updates

This codebase includes the latest domain additions and schema updates, including:

- Cart + checkout + multi-seller order workflows
- Product images support
- Notification domain with queue worker (BullMQ + Redis) and email delivery
- Product reviews model and APIs
- Product approval workflow (admin/QA moderation)
- Three-price system for products/orders:
  - seller price
  - admin listing price
  - platform margin snapshots on order items
- Razorpay payment flow with signature verification + webhook handling
- Shipping and fulfillment tracking APIs for buyer/seller/admin

---

## 🧱 Architecture Overview

### Backend (Layered Monolith)

- `controllers` → HTTP request/response layer
- `services` → business rules and domain orchestration
- `repositories` → database access layer
- `middlewares` → auth, validation, global error handling
- `notifications` → queue, worker, email channel integration
- `prisma` → schema, migrations, seed

### Frontend

- Next.js App Router architecture
- Service layer in `frontend/src/services` for API communication
- Seller dashboard, marketplace, product and review flows

### Mobile

- Expo Router based React Native app
- API access via `mobile/src/services`

---

## 🛠 Tech Stack

### Backend
- Node.js + Express (TypeScript)
- PostgreSQL + Prisma ORM
- Upstash Redis (cache) + Redis/BullMQ (queue worker)
- Zod validation
- Scalar/OpenAPI docs
- Razorpay integration
- Resend email provider

### Frontend
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4

### Mobile
- Expo 54 + React Native 0.81 + TypeScript

---

## 📁 Repository Structure

```text
Tat_Vivah-main/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── scripts/                # verification scripts
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── docs/
│       ├── middlewares/
│       ├── notifications/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── app.ts
│       ├── server.ts           # API process
│       └── worker.ts           # notification worker process
├── frontend/
│   └── src/
└── mobile/
    ├── app/
    └── src/
```

---

## ⚙️ Prerequisites

- Node.js `20+` recommended
- npm `10+`
- PostgreSQL database
- Redis instance (required for queue worker; optional for API-only mode)

---

## 🔐 Environment Configuration

Create environment files before running apps.

### 1) Backend: `backend/.env`

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME"

# Auth
JWT_ACCESS_SECRET="replace-with-32-plus-char-secret"
JWT_REFRESH_SECRET="replace-with-32-plus-char-secret"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# Upstash Redis (cache)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Redis URL (queue worker / BullMQ)
REDIS_URL="redis://default:password@host:port"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# ImageKit (optional if image endpoints are used)
IMAGEKIT_PUBLIC_KEY="..."
IMAGEKIT_PRIVATE_KEY="..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/..."

# Razorpay (optional unless RAZORPAY provider is used)
RAZORPAY_KEY_ID="rzp_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."

# CORS (optional)
CORS_ORIGIN="http://localhost:3001"
```

### 2) Frontend: `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="..."
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/..."
```

### 3) Mobile: `mobile/.env`

```env
EXPO_PUBLIC_API_BASE_URL="http://localhost:3000"
```

> For iOS simulator / Android emulator / physical devices, use a reachable network URL for the backend instead of `localhost` when needed.

---

## 🚀 Local Development Setup

### 1) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install
```

### 2) Prepare database

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 3) Run services (recommended in separate terminals)

#### Terminal A — Backend API
```bash
cd backend
npm run dev:api
```

#### Terminal B — Notification Worker
```bash
cd backend
npm run dev:worker
```

#### Terminal C — Web Frontend
```bash
cd frontend
npm run dev -- -p 3001
```

#### Terminal D — Mobile App
```bash
cd mobile
npm run dev
```

---

## 📚 API and Health Endpoints

When backend is running:

- API base: `http://localhost:3000`
- Health check: `GET /health`
- Docs (Scalar): `http://localhost:3000/docs`

Main route groups:

- `/v1/auth`
- `/v1/categories`, `/v1/products`
- `/v1/seller/products`, `/v1/seller/orders`, `/v1/seller/settlements`, `/v1/seller/shipments`
- `/v1/cart`, `/v1/checkout`, `/v1/orders`
- `/v1/payments`, `/v1/payments/webhook`
- `/v1/reviews`
- `/v1/admin`, `/v1/admin/notifications`, `/v1/admin/shipments`

---

## 🧪 Verification Scripts (Backend)

From `backend`:

```bash
# Domain checks
npm run verify:auth
npm run verify:product
npm run verify:cart
npm run verify:orders
npm run verify:payment
npm run verify:shipping
npm run verify:admin
npm run verify:notifications
npm run verify:razorpay

# Full verification suite
npm run verify:all
```

Also available:

```bash
npm run typecheck
npm run build
```

---

## 🔄 Production Notes

- Build backend: `cd backend && npm run build`
- Run API: `npm run start:api`
- Run worker: `npm run start:worker`
- Use `npx prisma migrate deploy` in production pipelines
- Ensure background worker is deployed alongside API for queued notifications
- Use secure secrets and production URLs for payment, email, and media services

---

## 🤝 Contributing

1. Create a feature branch from `main`
2. Keep changes scoped and tested with the relevant verification script(s)
3. Open a PR with a clear summary and migration notes (if schema changed)

---

## 📄 License

This repository is currently private/proprietary unless explicitly licensed otherwise by the maintainers.
