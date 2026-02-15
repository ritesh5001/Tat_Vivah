import client from 'prom-client';

/**
 * Prometheus-compatible metrics registry.
 *
 * Exposed via GET /metrics for scraping by Prometheus / Grafana / Datadog.
 * All counters follow the naming convention: `domain_event_total`.
 */

// Use the default global registry
export const register = client.register;

// Collect Node.js runtime metrics (GC, event loop, memory, etc.)
client.collectDefaultMetrics({ register });

// ─── Inventory ──────────────────────────────────────────────────────

export const inventoryReserveAttemptTotal = new client.Counter({
    name: 'inventory_reserve_attempt_total',
    help: 'Total inventory reserve attempts',
    labelNames: ['variantId'] as const,
});

export const inventoryReserveFailTotal = new client.Counter({
    name: 'inventory_reserve_fail_total',
    help: 'Total inventory reserve failures (out of stock)',
    labelNames: ['variantId'] as const,
});

// ─── Checkout ───────────────────────────────────────────────────────

export const checkoutSuccessTotal = new client.Counter({
    name: 'checkout_success_total',
    help: 'Total successful checkouts',
});

export const checkoutFailTotal = new client.Counter({
    name: 'checkout_fail_total',
    help: 'Total failed checkouts (any reason)',
    labelNames: ['reason'] as const,
});

// ─── Payment ────────────────────────────────────────────────────────

export const paymentSuccessTotal = new client.Counter({
    name: 'payment_success_total',
    help: 'Total successful payments',
});

export const paymentFailTotal = new client.Counter({
    name: 'payment_fail_total',
    help: 'Total failed payments',
});

// ─── Stale Orders ───────────────────────────────────────────────────

export const staleCancelTotal = new client.Counter({
    name: 'stale_cancel_total',
    help: 'Total stale orders cancelled',
});

// ─── Integrity ──────────────────────────────────────────────────────

export const integrityMismatchTotal = new client.Counter({
    name: 'integrity_mismatch_total',
    help: 'Total inventory integrity mismatches detected',
    labelNames: ['severity'] as const,
});

// ─── HTTP request duration (optional, useful for SLA monitoring) ────

export const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
