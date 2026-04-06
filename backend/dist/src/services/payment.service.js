import { paymentRepository } from '../repositories/payment.repository.js';
import { PaymentProvider, PaymentStatus, PaymentEventType, OrderStatus } from '@prisma/client';
import { prisma } from '../config/db.js';
import { ApiError } from '../errors/ApiError.js';
import { razorpayService } from './razorpay.service.js';
import { getRazorpayKeyId, isRazorpayConfigured, razorpayClient } from './razorpay.client.js';
import { emitPaymentSuccess, emitPaymentFailed } from '../events/order.events.js';
import { paymentLogger } from '../config/logger.js';
import { paymentSuccessTotal, staleCancelTotal, refundSuccessTotal } from '../config/metrics.js';
import { recordPaymentFailure } from '../monitoring/alerts.js';
import { generateInvoiceNumber } from '../utils/invoice.util.js';
import { commissionService } from './commission.service.js';
/** Maximum age (ms) of a PLACED order eligible for payment retry. */
const STALE_ORDER_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_SHIPPING_FEE_INR = 180;
const TX_MAX_WAIT_MS = 20000;
const TX_TIMEOUT_MS = 30000;
function roundMoney(value) {
    return Math.round(value * 100) / 100;
}
function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
function isTransactionStartTimeout(error) {
    if (!(error instanceof Error))
        return false;
    const msg = error.message.toLowerCase();
    return (msg.includes('unable to start a transaction in the given time') ||
        msg.includes('transaction api error') ||
        msg.includes('p2028'));
}
export class PaymentService {
    async findOrderForPayment(userId, orderId) {
        return prisma.order.findFirst({
            where: { id: orderId, userId },
            select: {
                id: true,
                userId: true,
                status: true,
                createdAt: true,
                totalAmount: true,
                grandTotal: true,
                subTotalAmount: true,
                totalTaxAmount: true,
            },
        });
    }
    resolvePayableAmount(order) {
        const totalAmount = toNumber(order.totalAmount);
        const grandTotal = toNumber(order.grandTotal);
        const subTotalAmount = toNumber(order.subTotalAmount);
        const totalTaxAmount = toNumber(order.totalTaxAmount);
        const hasItems = Array.isArray(order.items) && order.items.length > 0;
        const inferredShippingFromGrand = Math.max(0, grandTotal - subTotalAmount - totalTaxAmount);
        const shippingFee = inferredShippingFromGrand > 0
            ? inferredShippingFromGrand
            : hasItems
                ? DEFAULT_SHIPPING_FEE_INR
                : 0;
        const derivedAmount = subTotalAmount + totalTaxAmount + shippingFee;
        const payableAmount = Math.max(totalAmount, grandTotal, derivedAmount);
        return roundMoney(payableAmount);
    }
    // ------------------------------------------------------------------
    // Refund processing (idempotent, crash-safe)
    //
    // Architecture (matches RefundService.createRefund pattern):
    //   1. Optimistic-lock: mark payment REFUNDED in DB first
    //   2. Call Razorpay (outside tx — no long locks)
    //   3. If Razorpay fails → revert payment status to SUCCESS
    //   4. Never send money without a DB record
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
        // ── Step 1: Optimistic-lock DB update FIRST ─────────────────
        // Mark as REFUNDED before calling external provider.
        // If the provider call fails, we revert. This prevents the
        // "money refunded but DB still SUCCESS" double-refund bug.
        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.payment.updateMany({
                where: {
                    id: payment.id,
                    status: PaymentStatus.SUCCESS,
                },
                data: {
                    status: PaymentStatus.REFUNDED,
                },
            });
            if (result.count === 0) {
                return false;
            }
            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    type: PaymentEventType.WEBHOOK,
                    payload: {
                        event: 'REFUND_INITIATED',
                        orderId,
                    },
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
        // ── Step 2: External provider refund (outside tx) ───────────
        if (payment.provider === PaymentProvider.RAZORPAY
            && payment.providerPaymentId
            && isRazorpayConfigured()
            && razorpayClient) {
            try {
                await razorpayClient.payments.refund(payment.providerPaymentId, {
                    amount: Math.round(payment.amount * 100),
                    notes: { orderId },
                });
            }
            catch (error) {
                // ── Step 3: Revert DB status on provider failure ─────
                paymentLogger.error({ orderId, paymentId: payment.id, error: error?.message }, 'refund_provider_failed_reverting');
                await prisma.payment.updateMany({
                    where: { id: payment.id, status: PaymentStatus.REFUNDED },
                    data: { status: PaymentStatus.SUCCESS },
                });
                throw new ApiError(502, `Refund API failed: ${error?.message ?? 'unknown error'}`);
            }
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
    // Initiate / Re-initiate payment
    // ------------------------------------------------------------------
    async initiatePayment(userId, orderId, provider) {
        // 1. Validate Order
        const [order, existingPayment] = await Promise.all([
            this.findOrderForPayment(userId, orderId),
            paymentRepository.findPaymentByOrderId(orderId),
        ]);
        if (!order) {
            throw new ApiError(404, 'Order not found or access denied');
        }
        // Only PLACED orders are eligible for payment
        if (order.status !== OrderStatus.PLACED) {
            throw new ApiError(400, `Cannot initiate payment for order with status ${order.status}`);
        }
        // Guard: reject stale orders
        if (Date.now() - new Date(order.createdAt).getTime() > STALE_ORDER_TTL_MS) {
            throw new ApiError(410, 'Order has expired. Please place a new order.');
        }
        // Check for existing successful payment
        if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
            throw new ApiError(400, 'Order already paid');
        }
        const payableAmount = this.resolvePayableAmount(order);
        if (payableAmount > toNumber(order.totalAmount)) {
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    totalAmount: payableAmount,
                    grandTotal: Math.max(payableAmount, toNumber(order.grandTotal)),
                },
            });
        }
        // Create Payment Record (INITIATED) — reuse row on retry
        let payment;
        if (existingPayment) {
            // Fast path: reuse an existing INITIATED payment with active provider order.
            if (provider === PaymentProvider.RAZORPAY &&
                existingPayment.status === PaymentStatus.INITIATED &&
                existingPayment.provider === provider &&
                existingPayment.providerOrderId &&
                roundMoney(existingPayment.amount) === roundMoney(payableAmount)) {
                return {
                    paymentId: existingPayment.id,
                    orderId: existingPayment.providerOrderId,
                    amount: Math.round(payableAmount * 100),
                    currency: existingPayment.currency,
                    key: getRazorpayKeyId(),
                    provider: 'RAZORPAY',
                };
            }
            payment = await prisma.payment.update({
                where: { id: existingPayment.id },
                data: {
                    status: PaymentStatus.INITIATED,
                    amount: payableAmount,
                    providerOrderId: null,
                    providerPaymentId: null,
                    providerSignature: null,
                },
            });
        }
        else {
            payment = await paymentRepository.createPayment({
                orderId,
                userId,
                amount: payableAmount,
                currency: 'INR',
                provider,
                status: PaymentStatus.INITIATED
            });
        }
        // Log Event
        await paymentRepository.createPaymentEvent({
            paymentId: payment.id,
            type: PaymentEventType.INITIATED,
            payload: { provider, amount: payableAmount }
        });
        // Handle MOCK Provider
        if (provider === PaymentProvider.MOCK) {
            return {
                paymentId: payment.id,
                providerPaymentId: `mock_${payment.id}`,
                checkoutUrl: `https://mock-gateway.com/pay/${payment.id}`,
                amount: payableAmount,
                currency: 'INR'
            };
        }
        // Handle RAZORPAY Provider
        if (provider === PaymentProvider.RAZORPAY) {
            const razorpayOrder = await razorpayService.createOrder(payableAmount, 'INR', orderId, { orderId, userId });
            // Update payment with Razorpay order ID
            await paymentRepository.updateProviderOrderId(payment.id, razorpayOrder.razorpayOrderId);
            return {
                paymentId: payment.id,
                orderId: razorpayOrder.razorpayOrderId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: razorpayOrder.key,
                provider: 'RAZORPAY'
            };
        }
        // Handle other providers (placeholder)
        throw new ApiError(400, 'Provider not supported');
    }
    // ------------------------------------------------------------------
    // Retry payment for a PLACED order with FAILED / INITIATED payment
    // ------------------------------------------------------------------
    async retryPayment(userId, orderId) {
        const order = await this.findOrderForPayment(userId, orderId);
        if (!order) {
            throw new ApiError(404, 'Order not found or access denied');
        }
        if (order.status !== OrderStatus.PLACED) {
            throw new ApiError(400, `Cannot retry payment for order with status ${order.status}`);
        }
        // Guard: reject stale orders
        if (Date.now() - new Date(order.createdAt).getTime() > STALE_ORDER_TTL_MS) {
            throw new ApiError(410, 'Order has expired. Please place a new order.');
        }
        const existingPayment = await paymentRepository.findPaymentByOrderId(orderId);
        if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
            throw new ApiError(400, 'Order already paid');
        }
        // Only allow retry if payment is FAILED or INITIATED (abandoned)
        if (existingPayment && existingPayment.status !== PaymentStatus.FAILED && existingPayment.status !== PaymentStatus.INITIATED) {
            throw new ApiError(400, `Cannot retry payment with status ${existingPayment.status}`);
        }
        const provider = existingPayment?.provider ?? PaymentProvider.RAZORPAY;
        return this.initiatePayment(userId, orderId, provider);
    }
    // ------------------------------------------------------------------
    // Get payment details
    // ------------------------------------------------------------------
    async getPaymentDetails(orderId, userId) {
        const payment = await paymentRepository.findPaymentByOrderId(orderId);
        if (!payment) {
            throw new ApiError(404, 'Payment not found');
        }
        // Verify ownership via userId
        if (payment.userId !== userId) {
            throw new ApiError(403, 'Unauthorized');
        }
        return payment;
    }
    // ------------------------------------------------------------------
    // Verify Razorpay payment (client-side callback)
    // ------------------------------------------------------------------
    async verifyRazorpayPayment(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        const isValid = razorpayService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isValid) {
            throw new ApiError(401, 'Invalid payment signature');
        }
        const payment = await paymentRepository.findByProviderOrderId(razorpayOrderId);
        if (!payment) {
            throw new ApiError(404, 'Payment not found');
        }
        if (payment.userId !== userId) {
            throw new ApiError(403, 'Unauthorized');
        }
        // Idempotent — already succeeded (e.g. webhook arrived first)
        if (payment.status === PaymentStatus.SUCCESS) {
            return { message: 'Payment already verified', paymentId: payment.id };
        }
        try {
            await this.handlePaymentSuccess(payment.id, payment.orderId, razorpayPaymentId, { razorpayOrderId, razorpayPaymentId }, razorpaySignature);
        }
        catch (error) {
            if (isTransactionStartTimeout(error)) {
                const latest = await paymentRepository.findPaymentById(payment.id);
                if (latest?.status === PaymentStatus.SUCCESS) {
                    return { message: 'Payment already verified', paymentId: payment.id };
                }
                throw new ApiError(503, 'Payment is being finalized. Please refresh order status in a few seconds.');
            }
            throw error;
        }
        return { message: 'Payment verified', paymentId: payment.id };
    }
    // ------------------------------------------------------------------
    // Shared success handler — idempotent via optimistic lock inside tx
    // Both verify endpoint and webhook converge here.
    // ------------------------------------------------------------------
    async handlePaymentSuccess(paymentId, orderId, providerPaymentId, payload, providerSignature) {
        // Optimistic-lock approach: the UPDATE inside the transaction uses a
        // WHERE clause that includes `status != SUCCESS`. If another concurrent
        // call already flipped the status, the updateMany returns count === 0
        // and we bail out without creating duplicate settlements.
        const result = await prisma.$transaction(async (tx) => {
            // 1. Optimistic-lock update: only flip to SUCCESS if not already SUCCESS
            const updated = await tx.payment.updateMany({
                where: { id: paymentId, status: { not: PaymentStatus.SUCCESS } },
                data: {
                    status: PaymentStatus.SUCCESS,
                    providerPaymentId,
                    ...(providerSignature ? { providerSignature } : {})
                }
            });
            // If count === 0, another caller already marked SUCCESS → skip
            if (updated.count === 0) {
                return { alreadyProcessed: true };
            }
            // 2. Log Event
            await tx.paymentEvent.create({
                data: {
                    paymentId,
                    type: PaymentEventType.SUCCESS,
                    payload
                }
            });
            // 3. Update Order Status + assign invoice number atomically
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
        // Skip notifications if another call already handled this
        if (result.alreadyProcessed)
            return;
        paymentSuccessTotal.inc();
        paymentLogger.info({
            event: 'payment_success',
            orderId,
            paymentId,
            providerPaymentId,
        }, `Payment succeeded for order ${orderId}`);
        // Calculate and store seller commission settlements (idempotent)
        await commissionService.calculateAndStoreSellerSettlement(orderId);
        // Trigger Notifications (event-driven, idempotent, best-effort)
        await emitPaymentSuccess(orderId);
    }
    // ------------------------------------------------------------------
    // Shared failure handler — marks payment FAILED + releases inventory
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
                data: {
                    paymentId,
                    type: PaymentEventType.FAILED,
                    payload
                }
            });
        });
        // Notify buyer about payment failure (event-driven, idempotent, best-effort)
        if (payment.orderId) {
            await emitPaymentFailed(payment.orderId);
        }
        recordPaymentFailure();
        paymentLogger.warn({
            event: 'payment_failure',
            paymentId,
            orderId: payment.orderId,
        }, `Payment failed for payment ${paymentId}`);
        // Note: Inventory is NOT released here on purpose.
        // The order stays PLACED so the buyer can retry payment within the TTL.
        // Inventory release happens via cancelStaleOrders when the TTL expires.
    }
    // ------------------------------------------------------------------
    // Stale order auto-cancellation
    // Cancels PLACED orders older than STALE_ORDER_TTL_MS whose payment
    // is not SUCCESS, releases reserved inventory, and logs a FAILED event.
    // ------------------------------------------------------------------
    async cancelStaleOrders() {
        const cutoff = new Date(Date.now() - STALE_ORDER_TTL_MS);
        // Find stale PLACED orders whose payment is not SUCCESS (or has no payment).
        // Only fetch IDs here — movements are re-fetched inside the tx to avoid
        // stale data between the outer query and the transactional release.
        const staleOrders = await prisma.order.findMany({
            where: {
                status: OrderStatus.PLACED,
                createdAt: { lt: cutoff },
                OR: [
                    { payment: { status: { not: PaymentStatus.SUCCESS } } },
                    { payment: null },
                ],
            },
            include: {
                payment: true,
            },
        });
        let cancelledCount = 0;
        for (const order of staleOrders) {
            try {
                const wasCancelled = await prisma.$transaction(async (tx) => {
                    // 1. Optimistic-lock cancel: only flip to CANCELLED if still PLACED.
                    //    Between the findMany above and this tx, handlePaymentSuccess
                    //    may have already flipped the order to CONFIRMED — in that case
                    //    count === 0 and we skip, preventing double-release of inventory.
                    const updated = await tx.order.updateMany({
                        where: { id: order.id, status: OrderStatus.PLACED },
                        data: { status: OrderStatus.CANCELLED },
                    });
                    if (updated.count === 0) {
                        // Order was already confirmed/cancelled by another process — skip
                        return false;
                    }
                    // 2. Fetch movements INSIDE tx for consistency (prevents stale reads)
                    const movements = await tx.inventoryMovement.findMany({
                        where: { orderId: order.id, type: 'RESERVE' },
                    });
                    // 3. Release reserved inventory
                    for (const movement of movements) {
                        // Restore stock
                        await tx.inventory.update({
                            where: { variantId: movement.variantId },
                            data: { stock: { increment: movement.quantity } },
                        });
                        // Create RELEASE movement
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
                    // 4. Mark payment as FAILED if it's still INITIATED
                    if (order.payment && order.payment.status === PaymentStatus.INITIATED) {
                        await tx.payment.updateMany({
                            where: { id: order.payment.id, status: PaymentStatus.INITIATED },
                            data: { status: PaymentStatus.FAILED },
                        });
                        await tx.paymentEvent.create({
                            data: {
                                paymentId: order.payment.id,
                                type: PaymentEventType.FAILED,
                                payload: { reason: 'stale_order_auto_cancel' },
                            },
                        });
                    }
                    return true;
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
                else {
                    paymentLogger.debug({
                        event: 'stale_order_skip',
                        orderId: order.id,
                    }, `Skipped stale order ${order.id} (status already changed)`);
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