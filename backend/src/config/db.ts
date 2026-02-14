import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * Prisma client singleton
 * Ensures only one instance is created across the application
 */
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
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
        }

        return parsed.toString();
    } catch {
        return rawUrl;
    }
}

const prismaDatabaseUrl = buildPrismaDatabaseUrl(env.DATABASE_URL);

/**
 * Prisma client instance with logging based on environment
 */
export const prisma: PrismaClient =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasources: {
            db: {
                url: prismaDatabaseUrl,
            },
        },
        log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

// Prevent multiple instances in development (hot reloading)
if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler for Prisma connection
 */
export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
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
