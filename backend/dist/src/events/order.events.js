/**
 * Order Event Dispatchers
 *
 * Centralized event-driven notification dispatching.
 * All order-lifecycle notifications are triggered through these functions.
 *
 * KEY DESIGN DECISIONS:
 * 1. Every function is wrapped in try/catch — notification failure NEVER crashes
 *    the calling service (best-effort delivery).
 * 2. eventKey-based idempotency on every call — safe for double-fire from both
 *    checkout and webhook.
 * 3. Each emitter fetches its own context (order, items, seller) from DB so
 *    callers only pass orderId.
 */
import { prisma } from '../config/db.js';
import { notificationService } from '../notifications/notification.service.js';
import { orderEventsLogger } from '../config/logger.js';
// =========================================================================
//  ORDER PLACED — fires when checkout succeeds (before payment)
// =========================================================================
export async function emitOrderPlaced(orderId) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });
        if (!order)
            return;
        // Notify buyer
        await notificationService.notifyOrderPlaced(order.userId, order.id, Number(order.totalAmount));
        // Notify each seller
        const sellerMap = new Map();
        for (const item of order.items) {
            sellerMap.set(item.sellerId, (sellerMap.get(item.sellerId) ?? 0) + 1);
        }
        for (const [sellerId, count] of sellerMap) {
            await notificationService.notifySellerNewOrder(sellerId, order.id, count);
        }
    }
    catch (err) {
        orderEventsLogger.error({ orderId, error: err instanceof Error ? err.message : String(err) }, 'emitOrderPlaced failed');
    }
}
// =========================================================================
//  PAYMENT SUCCESS — fires when Razorpay payment is verified
// =========================================================================
export async function emitPaymentSuccess(orderId) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, userId: true, totalAmount: true }
        });
        if (!order)
            return;
        await notificationService.notifyPaymentSuccess(order.userId, order.id, Number(order.totalAmount));
    }
    catch (err) {
        orderEventsLogger.error({ orderId, error: err instanceof Error ? err.message : String(err) }, 'emitPaymentSuccess failed');
    }
}
// =========================================================================
//  PAYMENT FAILED — fires when Razorpay payment verification fails
// =========================================================================
export async function emitPaymentFailed(orderId) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, userId: true }
        });
        if (!order)
            return;
        await notificationService.notifyPaymentFailed(order.userId, order.id);
    }
    catch (err) {
        orderEventsLogger.error({ orderId, error: err instanceof Error ? err.message : String(err) }, 'emitPaymentFailed failed');
    }
}
// =========================================================================
//  SHIPMENT SHIPPED
// =========================================================================
export async function emitShipmentShipped(orderId, carrier, trackingNumber) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, userId: true }
        });
        if (!order)
            return;
        await notificationService.notifyOrderShipped(order.userId, order.id, carrier, trackingNumber);
    }
    catch (err) {
        orderEventsLogger.error({ orderId, carrier, trackingNumber, error: err instanceof Error ? err.message : String(err) }, 'emitShipmentShipped failed');
    }
}
// =========================================================================
//  SHIPMENT DELIVERED
// =========================================================================
export async function emitShipmentDelivered(orderId) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, userId: true }
        });
        if (!order)
            return;
        await notificationService.notifyOrderDelivered(order.userId, order.id);
    }
    catch (err) {
        orderEventsLogger.error({ orderId, error: err instanceof Error ? err.message : String(err) }, 'emitShipmentDelivered failed');
    }
}
//# sourceMappingURL=order.events.js.map