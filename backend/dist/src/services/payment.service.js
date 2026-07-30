import { paymentRepository } from '../repositories/payment.repository.js';
import { PaymentStatus, PaymentEventType, OrderStatus } from '@prisma/client';
import { prisma } from '../config/db.js';
import { ApiError } from '../errors/ApiError.js';
import { emitPaymentSuccess, emitPaymentFailed } from '../events/order.events.js';
import { paymentLogger } from '../config/logger.js';
import { paymentSuccessTotal, staleCancelTotal, refundSuccessTotal } from '../config/metrics.js';
import { recordPaymentFailure } from '../monitoring/alerts.js';
import { generateInvoiceNumber } from '../utils/invoice.util.js';
import { commissionService } from './commission.service.js';
import { dispatchFreshness } from '../live/freshness.service.js';
import { CACHE_TAGS, orderTag } from '../live/cache-tags.js';
// =====================================================================
// Payment service — GATEWAY-NEUTRAL scaffold.
//
// All specific payment-gateway integrations (Razorpay, PhonePe, GoKwik,
// COD, MOCK) have been removed so a new gateway can be built cleanly.
// This file keeps only the provider-agnostic order plumbing that the rest
// of the app depends on:
//   - handlePaymentSuccess  → confirm order + settlements (call from a new
//                             gateway's verify/webhook once rebuilt)
//   - handlePaymentFailure  → mark payment FAILED + notify
//   - processRefund         → mark payment REFUNDED (ledger only; the actual
//                             money movement is handled by the future gateway)
//   - cancelStaleOrders     → cron cleanup of unpaid PLACED orders
//   - getPaymentDetails     → read a payment record
//
// There is intentionally NO initiatePayment here yet — that is where the
// new gateway integration will hook in.
// =====================================================================
/** Maximum age (ms) of a PLACED order before stale-cleanup cancels it. */
const STALE_ORDER_TTL_MS = 30 * 60 * 1000; // 30 minutes
const TX_MAX_WAIT_MS = 20000;
const TX_TIMEOUT_MS = 30000;
export class PaymentService {
    // ------------------------------------------------------------------
    // Refund processing (idempotent, crash-safe)
    //
    // Ledger-only: marks the payment REFUNDED. With no gateway wired up,
    // the actual money return is handled manually/offline for now; the new
    // gateway will add its refund call here when rebuilt.
    // ------------------------------------------------------------------
    async processRefund(orderId) {
        const payment = await paymentRepository.findPaymentByOrderId(orderId);
        if (!payment) {
            return { refundTriggered: false, alreadyRefunded: false, paymentStatus: null };
        }
        if (payment.status === PaymentStatus.REFUNDED) {
            return {
                refundTriggered: false,
                alreadyRefunded: true,
                paymentStatus: PaymentStatus.REFUNDED,
            };
        }
        if (payment.status !== PaymentStatus.SUCCESS) {
            return {
                refundTriggered: false,
                alreadyRefunded: false,
                paymentStatus: payment.status,
            };
        }
        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.payment.updateMany({
                where: { id: payment.id, status: PaymentStatus.SUCCESS },
                data: { status: PaymentStatus.REFUNDED },
            });
            if (result.count === 0) {
                return false;
            }
            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    type: PaymentEventType.WEBHOOK,
                    payload: { event: 'REFUND_INITIATED', orderId },
                },
            });
            return true;
        });
        if (!updated) {
            return {
                refundTriggered: false,
                alreadyRefunded: true,
                paymentStatus: PaymentStatus.REFUNDED,
            };
        }
        refundSuccessTotal.inc();
        paymentLogger.info({ orderId, paymentId: payment.id }, 'refund_processed');
        return {
            refundTriggered: true,
            alreadyRefunded: false,
            paymentStatus: PaymentStatus.REFUNDED,
        };
    }
    // ------------------------------------------------------------------
    // Get payment details
    // ------------------------------------------------------------------
    async getPaymentDetails(orderId, userId) {
        const payment = await paymentRepository.findPaymentByOrderId(orderId);
        if (!payment) {
            throw new ApiError(404, 'Payment not found');
        }
        if (payment.userId !== userId) {
            throw new ApiError(403, 'Unauthorized');
        }
        return payment;
    }
    // ------------------------------------------------------------------
    // Confirm an order that has no online payment step.
    //
    // With the payment gateways removed, checkout can't collect money, so an
    // order would otherwise sit PLACED forever and be auto-cancelled by
    // cancelStaleOrders after 30 min. This moves the order PLACED → CONFIRMED
    // and assigns an invoice so it is fulfillable and not stale-cancelled.
    // Idempotent via an optimistic lock on the order status.
    // ------------------------------------------------------------------
    async confirmOrderWithoutPayment(orderId) {
        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.order.updateMany({
                where: { id: orderId, status: OrderStatus.PLACED },
                data: { status: OrderStatus.CONFIRMED },
            });
            if (updated.count === 0) {
                return { alreadyProcessed: true };
            }
            const invoiceNumber = await generateInvoiceNumber(tx);
            await tx.order.update({
                where: { id: orderId },
                data: { invoiceNumber, invoiceIssuedAt: new Date() },
            });
            return { alreadyProcessed: false };
        }, {
            maxWait: TX_MAX_WAIT_MS,
            timeout: TX_TIMEOUT_MS,
        });
        if (result.alreadyProcessed)
            return;
        paymentLogger.info({ event: 'order_confirmed_no_payment', orderId }, `Order confirmed (no payment): ${orderId}`);
        // No payment happened, so we intentionally do NOT send a
        // "payment received" notification — just refresh the live views.
        await dispatchFreshness({
            type: 'order.updated',
            entityId: orderId,
            tags: [
                CACHE_TAGS.orders,
                CACHE_TAGS.userOrders,
                CACHE_TAGS.sellerOrders,
                orderTag(orderId),
            ],
            audience: { allAuthenticated: true },
        });
    }
    // ------------------------------------------------------------------
    // Shared success handler — idempotent via optimistic lock inside tx.
    // A future gateway's verify/webhook should converge here to confirm
    // the order and create settlements.
    // ------------------------------------------------------------------
    async handlePaymentSuccess(paymentId, orderId, providerPaymentId, payload, providerSignature) {
        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.payment.updateMany({
                where: { id: paymentId, status: { not: PaymentStatus.SUCCESS } },
                data: {
                    status: PaymentStatus.SUCCESS,
                    providerPaymentId,
                    ...(providerSignature ? { providerSignature } : {})
                }
            });
            if (updated.count === 0) {
                return { alreadyProcessed: true };
            }
            await tx.paymentEvent.create({
                data: { paymentId, type: PaymentEventType.SUCCESS, payload }
            });
            const invoiceNumber = await generateInvoiceNumber(tx);
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.CONFIRMED,
                    invoiceNumber,
                    invoiceIssuedAt: new Date(),
                },
            });
            return { alreadyProcessed: false };
        }, {
            maxWait: TX_MAX_WAIT_MS,
            timeout: TX_TIMEOUT_MS,
        });
        if (result.alreadyProcessed)
            return;
        paymentSuccessTotal.inc();
        paymentLogger.info({
            event: 'payment_success',
            orderId,
            paymentId,
            providerPaymentId,
        }, `Payment succeeded for order ${orderId}`);
        await commissionService.calculateAndStoreSellerSettlement(orderId);
        await emitPaymentSuccess(orderId);
        await dispatchFreshness({
            type: 'payment.updated',
            entityId: orderId,
            tags: [
                CACHE_TAGS.payments,
                CACHE_TAGS.orders,
                CACHE_TAGS.userOrders,
                CACHE_TAGS.sellerOrders,
                orderTag(orderId),
            ],
            audience: { allAuthenticated: true },
        });
    }
    // ------------------------------------------------------------------
    // Shared failure handler — marks payment FAILED + notifies buyer.
    // ------------------------------------------------------------------
    async handlePaymentFailure(paymentId, payload) {
        const payment = await paymentRepository.findPaymentById(paymentId);
        if (!payment)
            return;
        if (payment.status === PaymentStatus.SUCCESS)
            return;
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: paymentId },
                data: { status: PaymentStatus.FAILED }
            });
            await tx.paymentEvent.create({
                data: { paymentId, type: PaymentEventType.FAILED, payload }
            });
        });
        if (payment.orderId) {
            await emitPaymentFailed(payment.orderId);
            await dispatchFreshness({
                type: 'payment.updated',
                entityId: payment.orderId,
                tags: [
                    CACHE_TAGS.payments,
                    CACHE_TAGS.orders,
                    CACHE_TAGS.userOrders,
                    orderTag(payment.orderId),
                ],
                audience: { allAuthenticated: true },
            });
        }
        recordPaymentFailure();
        paymentLogger.warn({
            event: 'payment_failure',
            paymentId,
            orderId: payment.orderId,
        }, `Payment failed for payment ${paymentId}`);
        // Inventory is released by cancelStaleOrders when the TTL expires.
    }
    // ------------------------------------------------------------------
    // Stale order auto-cancellation.
    // Cancels PLACED orders older than STALE_ORDER_TTL_MS whose payment is
    // not SUCCESS, releases reserved inventory, and logs a FAILED event.
    // ------------------------------------------------------------------
    async cancelStaleOrders() {
        const cutoff = new Date(Date.now() - STALE_ORDER_TTL_MS);
        const staleOrders = await prisma.order.findMany({
            where: {
                status: OrderStatus.PLACED,
                createdAt: { lt: cutoff },
                OR: [
                    { payment: { status: { not: PaymentStatus.SUCCESS } } },
                    { payment: null },
                ],
            },
            include: { payment: true },
        });
        let cancelledCount = 0;
        for (const order of staleOrders) {
            try {
                const reserveMovements = await prisma.inventoryMovement.findMany({
                    where: { orderId: order.id, type: 'RESERVE' },
                    select: { variantId: true, quantity: true },
                });
                const wasCancelled = await prisma.$transaction(async (tx) => {
                    const updated = await tx.order.updateMany({
                        where: { id: order.id, status: OrderStatus.PLACED },
                        data: { status: OrderStatus.CANCELLED },
                    });
                    if (updated.count === 0) {
                        return false;
                    }
                    for (const movement of reserveMovements) {
                        await tx.inventory.update({
                            where: { variantId: movement.variantId },
                            data: { stock: { increment: movement.quantity } },
                        });
                        await tx.inventoryMovement.create({
                            data: {
                                variantId: movement.variantId,
                                orderId: order.id,
                                quantity: movement.quantity,
                                type: 'RELEASE',
                                reason: 'STALE_CLEANUP',
                            },
                        });
                    }
                    if (order.payment) {
                        const updatedPayment = await tx.payment.updateMany({
                            where: { id: order.payment.id, status: PaymentStatus.INITIATED },
                            data: { status: PaymentStatus.FAILED },
                        });
                        if (updatedPayment.count > 0) {
                            await tx.paymentEvent.create({
                                data: {
                                    paymentId: order.payment.id,
                                    type: PaymentEventType.FAILED,
                                    payload: { reason: 'stale_order_auto_cancel' },
                                },
                            });
                        }
                    }
                    return true;
                }, {
                    maxWait: TX_MAX_WAIT_MS,
                    timeout: TX_TIMEOUT_MS,
                });
                if (wasCancelled) {
                    cancelledCount++;
                    staleCancelTotal.inc();
                    paymentLogger.info({
                        event: 'stale_order_cancelled',
                        orderId: order.id,
                        userId: order.userId,
                    }, `Stale order cancelled: ${order.id}`);
                }
            }
            catch (err) {
                paymentLogger.error({
                    event: 'stale_order_cancel_failed',
                    orderId: order.id,
                    error: err instanceof Error ? err.message : String(err),
                }, `Failed to cancel stale order ${order.id}`);
            }
        }
        return { cancelled: cancelledCount, total: staleOrders.length };
    }
}
export const paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map