
import { paymentService } from './payment.service.js';
import { PaymentProvider, PaymentStatus, PaymentEventType, OrderStatus, SettlementStatus } from '@prisma/client';
import { ApiError } from '../errors/ApiError.js';
import { razorpayService, RazorpayWebhookPayload } from './razorpay.service.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { prisma } from '../config/db.js';
import { notificationService } from '../notifications/notification.service.js';

export class WebhookService {

    async processWebhook(provider: string, payload: any, signature: string, rawBody?: string) {
        // 1. Validate Provider
        const validProvider = this.mapProvider(provider);
        if (!validProvider) {
            throw new ApiError(400, 'Invalid provider');
        }

        // 2. Handle MOCK Provider
        if (validProvider === PaymentProvider.MOCK) {
            await this.handleMockWebhook(payload);
            return;
        }

        // 3. Handle RAZORPAY Provider
        if (validProvider === PaymentProvider.RAZORPAY) {
            await this.handleRazorpayWebhook(payload, signature, rawBody || JSON.stringify(payload));
            return;
        }

        throw new ApiError(400, 'Provider webhook not implemented');
    }

    private async handleMockWebhook(payload: any) {
        const { paymentId, status, providerPaymentId } = payload;

        if (status === 'SUCCESS') {
            await paymentService.handlePaymentSuccess(paymentId, providerPaymentId, payload);
        } else if (status === 'FAILED') {
            await paymentService.handlePaymentFailure(paymentId, payload);
        }
    }

    private async handleRazorpayWebhook(payload: RazorpayWebhookPayload, signature: string, rawBody: string) {
        // 1. Verify Signature
        const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
        if (!isValid) {
            console.error('[Razorpay Webhook] Invalid signature');
            throw new ApiError(401, 'Invalid webhook signature');
        }

        // 2. Parse Event
        const event = payload.event;
        console.log(`[Razorpay Webhook] Received event: ${event}`);

        // 3. Handle payment.captured
        if (event === 'payment.captured') {
            await this.handleRazorpayPaymentCaptured(payload, signature);
            return;
        }

        // 4. Handle payment.failed
        if (event === 'payment.failed') {
            await this.handleRazorpayPaymentFailed(payload);
            return;
        }

        // 5. Log unhandled events
        console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
    }

    private async handleRazorpayPaymentCaptured(payload: RazorpayWebhookPayload, signature: string) {
        const paymentEntity = payload.payload.payment?.entity;
        if (!paymentEntity) {
            console.error('[Razorpay Webhook] Missing payment entity');
            return;
        }

        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        // Find payment by Razorpay order ID
        const payment = await paymentRepository.findByProviderOrderId(razorpayOrderId);
        if (!payment) {
            console.error(`[Razorpay Webhook] Payment not found for order: ${razorpayOrderId}`);
            return;
        }

        // Idempotency: Skip if already SUCCESS
        if (payment.status === PaymentStatus.SUCCESS) {
            console.log(`[Razorpay Webhook] Payment already successful: ${payment.id}`);
            return;
        }

        // Transactional Update
        await prisma.$transaction(async (tx) => {
            // 1. Update Payment with signature for audit
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.SUCCESS,
                    providerPaymentId: razorpayPaymentId,
                    providerSignature: signature
                }
            });

            // 2. Log Webhook Event
            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    type: PaymentEventType.WEBHOOK,
                    payload: payload as any
                }
            });

            // 3. Update Order Status
            await tx.order.update({
                where: { id: payment.orderId },
                data: { status: OrderStatus.CONFIRMED }
            });

            // 4. Create Seller Settlements
            const orderItems = await tx.orderItem.findMany({
                where: { orderId: payment.orderId }
            });

            for (const item of orderItems) {
                await tx.sellerSettlement.create({
                    data: {
                        sellerId: item.sellerId,
                        orderItemId: item.id,
                        amount: item.sellerPriceSnapshot ?? item.priceSnapshot,
                        status: SettlementStatus.PENDING
                    }
                });
            }
        });

        console.log(`[Razorpay Webhook] Payment ${payment.id} marked SUCCESS`);

        // 5. Trigger Notifications (outside transaction)
        try {
            // Get order details for notification
            const order = await prisma.order.findUnique({
                where: { id: payment.orderId },
                include: { items: true }
            });

            if (order) {
                // Notify buyer
                await notificationService.notifyOrderPlaced(order.userId, order.id, order.totalAmount);

                // Notify sellers
                const sellerIds = [...new Set(order.items.map(item => item.sellerId))];
                for (const sellerId of sellerIds) {
                    const sellerItems = order.items.filter(item => item.sellerId === sellerId);
                    await notificationService.notifySellerNewOrder(sellerId, order.id, sellerItems.length);
                }
            }
        } catch (notifyError) {
            console.error('[Razorpay Webhook] Notification error:', notifyError);
            // Don't throw - payment was successful, notifications are best-effort
        }
    }

    private async handleRazorpayPaymentFailed(payload: RazorpayWebhookPayload) {
        const paymentEntity = payload.payload.payment?.entity;
        if (!paymentEntity) {
            console.error('[Razorpay Webhook] Missing payment entity in failed event');
            return;
        }

        const razorpayOrderId = paymentEntity.order_id;

        // Find payment by Razorpay order ID
        const payment = await paymentRepository.findByProviderOrderId(razorpayOrderId);
        if (!payment) {
            console.error(`[Razorpay Webhook] Payment not found for failed order: ${razorpayOrderId}`);
            return;
        }

        // Idempotency: Skip if already in terminal state
        if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) {
            console.log(`[Razorpay Webhook] Payment already in terminal state: ${payment.id}`);
            return;
        }

        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.FAILED }
            });

            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    type: PaymentEventType.FAILED,
                    payload: payload as any
                }
            });
        });

        console.log(`[Razorpay Webhook] Payment ${payment.id} marked FAILED`);
    }

    private mapProvider(provider: string): PaymentProvider | null {
        const p = provider.toUpperCase();
        if (Object.values(PaymentProvider).includes(p as PaymentProvider)) {
            return p as PaymentProvider;
        }
        return null;
    }
}

export const webhookService = new WebhookService();

