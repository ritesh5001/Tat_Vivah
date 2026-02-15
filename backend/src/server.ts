import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma, disconnectDatabase } from './config/db.js';
import { closeQueueResources } from './notifications/notification.queue.js';
import { paymentService } from './services/payment.service.js';
import { logger } from './config/logger.js';
import { runInventoryIntegrityCheck } from './jobs/inventoryIntegrity.js';

/** How often to run the stale-order cleanup (10 minutes). */
const STALE_ORDER_INTERVAL_MS = 10 * 60 * 1000;

/** How often to run the inventory integrity check (10 minutes). */
const INTEGRITY_CHECK_INTERVAL_MS = 10 * 60 * 1000;

/** Guard: only execute shutdown sequence once. */
let isShuttingDown = false;

/**
 * Start the server
 */
async function bootstrap(): Promise<void> {
    try {
        // Verify database connection
        await prisma.$connect();
        logger.info('Database connected successfully');

        // Create Express app
        const app = createApp();

        // Start server
        const server = app.listen(env.PORT,"0.0.0.0", () => {
            logger.info({ port: env.PORT, env: env.NODE_ENV }, `Server running on port ${env.PORT}`);
        });

        // ---- Stale-order cleanup (runs every 10 min) ----
        const staleOrderTimer = setInterval(async () => {
            try {
                const result = await paymentService.cancelStaleOrders();
                (app as any).__setLastStaleCleanup(new Date());
                if (result.cancelled > 0) {
                    logger.info({ cancelled: result.cancelled, total: result.total }, 'Stale order cleanup completed');
                }
            } catch (err) {
                logger.error({ err }, 'Stale order cleanup error');
            }
        }, STALE_ORDER_INTERVAL_MS);

        // ---- Inventory integrity check (runs every 10 min) ----
        const integrityTimer = setInterval(async () => {
            try {
                const report = await runInventoryIntegrityCheck();
                (app as any).__setIntegrityReport(report);
            } catch (err) {
                logger.error({ err }, 'Inventory integrity check error');
            }
        }, INTEGRITY_CHECK_INTERVAL_MS);

        // Run both once on startup (after a short delay to let connections settle)
        setTimeout(async () => {
            try {
                const result = await paymentService.cancelStaleOrders();
                (app as any).__setLastStaleCleanup(new Date());
                if (result.cancelled > 0) {
                    logger.info({ cancelled: result.cancelled }, 'Initial stale order cleanup completed');
                }
            } catch (err) {
                logger.error({ err }, 'Initial stale order cleanup error');
            }

            try {
                const report = await runInventoryIntegrityCheck();
                (app as any).__setIntegrityReport(report);
            } catch (err) {
                logger.error({ err }, 'Initial integrity check error');
            }
        }, 5000);

        // ------------------------------------------------------------------
        // Graceful shutdown
        // ------------------------------------------------------------------

        const shutdown = async (signal: string): Promise<void> => {
            if (isShuttingDown) return;          // prevent re-entry on second SIGINT
            isShuttingDown = true;

            logger.info({ signal }, 'Shutting down gracefully…');

            clearInterval(staleOrderTimer);
            clearInterval(integrityTimer);

            server.close(async () => {
                logger.info('HTTP server closed');
                await closeQueueResources().catch(() => {});
                await disconnectDatabase();
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10_000).unref();             // .unref() so timer alone won't keep process alive
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.fatal({ err: error }, 'Failed to start server');
        await closeQueueResources().catch(() => {});
        await disconnectDatabase();
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// Process-wide crash handlers — ensures Prisma pool drains on unexpected exit
// ---------------------------------------------------------------------------

process.on('unhandledRejection', async (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection — shutting down');
    await disconnectDatabase();
    process.exit(1);
});

process.on('uncaughtException', async (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    await disconnectDatabase();
    process.exit(1);
});

// Start the application
bootstrap();
