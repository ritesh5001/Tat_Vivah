import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
// ---------------------------------------------------------------------------
// Global singleton guard — prevents duplicate PrismaClient instances when
// tsx watch-mode (or Next.js HMR) re-executes this module on file change.
// ---------------------------------------------------------------------------
const globalForPrisma = globalThis;
function getIntEnv(name, fallback, min, max) {
    const raw = process.env[name];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed))
        return fallback;
    const n = Math.trunc(parsed);
    if (n < min)
        return min;
    if (n > max)
        return max;
    return n;
}
function buildPrismaDatabaseUrl(rawUrl, directUrl) {
    try {
        const sourceUrl = directUrl ?? rawUrl;
        const parsed = new URL(sourceUrl);
        const isPooledHost = parsed.hostname.includes('-pooler.');
        const pooledConnectionLimit = getIntEnv('DB_POOL_CONNECTION_LIMIT', 10, 1, 100);
        const pooledPoolTimeout = getIntEnv('DB_POOL_TIMEOUT', 15, 1, 120);
        const directConnectionLimit = getIntEnv('DB_DIRECT_CONNECTION_LIMIT', 5, 1, 100);
        if (isPooledHost) {
            // If we only have the pooled Neon endpoint, Prisma can still connect more
            // reliably through the direct host. Prefer it unless an explicit direct
            // URL has already been supplied.
            if (!directUrl) {
                parsed.hostname = parsed.hostname.replace('-pooler.', '.');
            }
            parsed.searchParams.set('pgbouncer', 'true');
            parsed.searchParams.set('connection_limit', String(pooledConnectionLimit));
            parsed.searchParams.set('pool_timeout', String(pooledPoolTimeout));
        }
        // For non-pooled (direct) connections, keep a smaller default pool size.
        if (!isPooledHost && !parsed.searchParams.has('connection_limit')) {
            parsed.searchParams.set('connection_limit', String(directConnectionLimit));
        }
        return parsed.toString();
    }
    catch {
        return rawUrl;
    }
}
function createPrismaClient() {
    const client = new PrismaClient({
        datasources: {
            db: { url: buildPrismaDatabaseUrl(env.DATABASE_URL, env.DATABASE_URL_DIRECT) },
        },
        log: env.NODE_ENV === 'development'
            ? [{ emit: 'stdout', level: 'query' }]
            : [],
    });
    return client;
}
/**
 * Singleton PrismaClient instance used across the entire backend.
 * In non-production environments it is pinned to globalThis so tsx
 * watch-mode restarts reuse the same connection pool.
 */
export const prisma = globalForPrisma.__prisma ?? createPrismaClient();
if (env.NODE_ENV !== 'production') {
    globalForPrisma.__prisma = prisma;
}
// ---------------------------------------------------------------------------
// Neon idle-timeout safety
// Neon serverless Postgres closes idle connections after ~5 min. Prisma's
// query engine reconnects automatically on the next query, but the internal
// error event fires first. We swallow it so it doesn't pollute logs or
// trigger uncaught-error handlers.
// ---------------------------------------------------------------------------
// @ts-expect-error — Prisma's $on('error') is loosely typed at runtime
prisma.$on('error', (e) => {
    if (e.message?.includes('Closed') ||
        e.message?.includes("Can't reach database server")) {
        // Intentionally silent — Prisma reconnects automatically
        return;
    }
    // All other Prisma-level errors still surface
    console.error('[prisma] internal error:', e);
});
// ---------------------------------------------------------------------------
// Lifecycle helpers (called from server.ts)
// ---------------------------------------------------------------------------
/**
 * Graceful shutdown handler for Prisma connection.
 * Safe to call multiple times (Prisma ignores repeat disconnects).
 */
export async function disconnectDatabase() {
    try {
        await prisma.$disconnect();
    }
    catch {
        // Swallow — connection may already be closed during forced shutdown
    }
}
/**
 * Health check for database connection
 */
export async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=db.js.map