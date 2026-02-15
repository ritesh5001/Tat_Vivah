import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma, disconnectDatabase } from './config/db.js';
import { closeQueueResources } from './notifications/notification.queue.js';
import { paymentService } from './services/payment.service.js';

/** How often to run the stale-order cleanup (10 minutes). */
const STALE_ORDER_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Start the server
 */
async function bootstrap(): Promise<void> {
    try {
        // Verify database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Create Express app
        const app = createApp();

        // Start server
        const server = app.listen(env.PORT,"0.0.0.0", () => {
            console.log(`🚀 Server running on port ${env.PORT}`);
            console.log(`📝 Environment: ${env.NODE_ENV}`);
        });

        // ---- Stale-order cleanup (runs every 10 min) ----
        const staleOrderTimer = setInterval(async () => {
            try {
                const result = await paymentService.cancelStaleOrders();
                if (result.cancelled > 0) {
                    console.log(`[StaleOrders] Cancelled ${result.cancelled}/${result.total} stale orders`);
                }
            } catch (err) {
                console.error('[StaleOrders] Cleanup error:', err);
            }
        }, STALE_ORDER_INTERVAL_MS);

        // Run once on startup (after a short delay to let connections settle)
        setTimeout(async () => {
            try {
                const result = await paymentService.cancelStaleOrders();
                if (result.cancelled > 0) {
                    console.log(`[StaleOrders] Initial cleanup: cancelled ${result.cancelled} stale orders`);
                }
            } catch (err) {
                console.error('[StaleOrders] Initial cleanup error:', err);
            }
        }, 5000);

        // Graceful shutdown handlers
        const shutdown = async (signal: string): Promise<void> => {
            console.log(`\n${signal} received. Shutting down gracefully...`);

            clearInterval(staleOrderTimer);

            server.close(async () => {
                console.log('🔒 HTTP server closed');
                await closeQueueResources();
                await disconnectDatabase();
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                console.error('⚠️ Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        await closeQueueResources();
        await disconnectDatabase();
        process.exit(1);
    }
}

// Start the application
bootstrap();
