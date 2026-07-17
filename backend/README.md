# TatVivah Backend

Multi-vendor e-commerce backend built with Express, Prisma, and PostgreSQL.

---

## Render Deployment

Use migration-safe commands in Render:

- Build Command: `npm install && npm run build:render`
- Start Command: `npm run start:render`
- Health Check Path: `/health/live`

Do not run `npm run start:render` as the build command. It starts a long-running server process and Render will terminate it during build.

### Virtual Try-On Environment

Set `FASHN_API_KEY` in the backend environment to enable mobile virtual try-on.

Optional tuning:

```bash
FASHN_TRYON_MODEL=tryon-max
FASHN_POLL_INTERVAL_MS=3000
FASHN_POLL_TIMEOUT_MS=115000
```

---

## Payment Gateways

Three payment options are supported: Razorpay (SDK/modal flow), PhonePe (redirect flow, Standard Checkout v2), and COD (Cash on Delivery). Buyers pick the option at checkout on both web and mobile.

### Cash on Delivery (COD)

COD needs no gateway or configuration. When a buyer chooses COD:

1. The order is confirmed immediately (status `PLACED → CONFIRMED`, invoice assigned) so the seller can fulfil it. The `Payment` row is created with `provider = COD`, `status = INITIATED` — no money is collected yet.
2. Seller settlements are **not** created at this point; the cash hasn't been received.
3. When the order is marked `DELIVERED` (all shipments delivered), the backend automatically captures the COD payment: `status INITIATED → SUCCESS`, and seller settlements are created. This runs inside the shipment status sync (`ShipmentService.checkAndSyncOrderStatus`).
4. Refunds on a delivered COD order are recorded in the ledger but settled offline (cash returned to the buyer) — there is no gateway call.

### Razorpay Environment

```bash
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

### PhonePe Environment

Credentials come from the [PhonePe Business dashboard](https://business.phonepe.com) (Developer Settings → API Keys):

```bash
PHONEPE_CLIENT_ID=...            # from PhonePe dashboard
PHONEPE_CLIENT_SECRET=...        # from PhonePe dashboard
PHONEPE_CLIENT_VERSION=1         # dashboard shows this next to the key
PHONEPE_ENV=SANDBOX              # SANDBOX | PRODUCTION
PHONEPE_WEBHOOK_USERNAME=...     # you choose these when configuring the
PHONEPE_WEBHOOK_PASSWORD=...     # webhook on the PhonePe dashboard
PHONEPE_MOBILE_REDIRECT_URL=     # optional deep link for the mobile app
FRONTEND_BASE_URL=https://...    # required — PhonePe redirects buyers to
                                 # $FRONTEND_BASE_URL/checkout/phonepe/callback
```

### PhonePe Dashboard Setup

1. Generate API keys (client id/secret) and set `PHONEPE_ENV` to match the key type.
2. Configure the webhook URL: `https://<backend-host>/v1/webhooks/phonepe` with a username + password, and mirror them in `PHONEPE_WEBHOOK_USERNAME` / `PHONEPE_WEBHOOK_PASSWORD`.
3. Subscribe to the `checkout.order.completed` and `checkout.order.failed` events.

### Payment Flow (PhonePe)

1. Client calls `POST /v1/payments/initiate` with `provider: "PHONEPE"` (and `platform: "WEB" | "MOBILE"`); the API responds with a `redirectUrl`.
2. The buyer completes payment on PhonePe's hosted page and is redirected back (web: `/checkout/phonepe/callback`; mobile: app polls).
3. Client calls `POST /v1/payments/phonepe/verify` with `{ orderId }`; the backend confirms the state server-to-server with PhonePe's Order Status API before marking the payment SUCCESS. Webhooks provide the same confirmation asynchronously.

---

## Cancellation Engine Verification

### Apply Migration

```bash
npx prisma migrate deploy
```

If migration fails due to schema drift, do not use `prisma db push` on databases with existing production data.
Use:

```bash
npx prisma generate
npx prisma migrate status
```

Then resolve migration history with `prisma migrate resolve` only for explicitly reviewed migrations.

### Run Concurrency Test

```bash
npm run verify:cancellation-race
```

### Expected Guarantees

- **Inventory consistency** — stock never goes negative; no duplicate RELEASE movements
- **Idempotent refunds** — refund only fires once per cancellation approval
- **Shipment safety** — shipped orders cannot be cancelled, refunded, or have inventory restored
- **Concurrency-safe cancellation** — row-level locking prevents race conditions between approve, payment, and shipment operations
