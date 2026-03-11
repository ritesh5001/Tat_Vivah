import { PrismaClient } from '../../node_modules/.prisma/client/index.js';
import { env } from './env.js';

// ---------------------------------------------------------------------------
// Global singleton guard — prevents duplicate PrismaClient instances when
// tsx watch-mode (or Next.js HMR) re-executes this module on file change.
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
    __prisma: PrismaClient | undefined;
};

function buildPrismaDatabaseUrl(rawUrl: string): string {
    try {
        const parsed = new URL(rawUrl);
        const isPooledHost = parsed.hostname.includes('-pooler.');

        if (isPooledHost) {
            if (!parsed.searchParams.has('pgbouncer')) {
                parsed.searchParams.set('pgbouncer', 'true');
            }

            if (!parsed.searchParams.has('connection_limit')) {
                parsed.searchParams.set('connection_limit', '1');
            }

            // Prevent Prisma from waiting indefinitely for a pooled connection
            if (!parsed.searchParams.has('pool_timeout')) {
                parsed.searchParams.set('pool_timeout', '15');
            }
        }

        // For non-pooled (direct) connections, set a reasonable pool size
        if (!isPooledHost && !parsed.searchParams.has('connection_limit')) {
            parsed.searchParams.set('connection_limit', '5');
        }

        return parsed.toString();
    } catch {
        return rawUrl;
    }
}

function createPrismaClient() {
    const client = new PrismaClient({
        datasources: {
            db: { url: buildPrismaDatabaseUrl(env.DATABASE_URL) },
        },
        // Only log errors — removes noisy query/warn spam in dev terminal
        log: ['error'],
    });

    return client;
}

/**
 * Singleton PrismaClient instance used across the entire backend.
 * In non-production environments it is pinned to globalThis so tsx
 * watch-mode restarts reuse the same connection pool.
 */
export const prisma =
    globalForPrisma.__prisma ?? createPrismaClient();

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
prisma.$on('error', (e: { message?: string }) => {
    if (e.message?.includes('Closed')) {
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
export async function disconnectDatabase(): Promise<void> {
    try {
        await prisma.$disconnect();
    } catch {
        // Swallow — connection may already be closed during forced shutdown
    }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch {
        return false;
    }
}
