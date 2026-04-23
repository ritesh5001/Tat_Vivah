# TatVivah Backend

Multi-vendor e-commerce backend built with Express, Prisma, and PostgreSQL.

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
