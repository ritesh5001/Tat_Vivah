import { paymentService } from './payment.service.js';
import { PaymentProvider, PaymentStatus, PaymentEventType } from '@prisma/client';
import { ApiError } from '../errors/ApiError.js';
import { razorpayService } from './razorpay.service.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { prisma } from '../config/db.js';
import { paymentLogger } from '../config/logger.js';
export class WebhookService {
    async processWebhook(provider, payload, signature, rawBody) {
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
    async handleMockWebhook(payload) {
        const { paymentId, status, providerPaymentId } = payload;
        if (status === 'SUCCESS') {
            // Look up orderId for the shared handler
            const payment = await paymentRepository.findPaymentById(paymentId);
            if (payment) {
                await paymentService.handlePaymentSuccess(paymentId, payment.orderId, providerPaymentId, payload);
            }
        }
        else if (status === 'FAILED') {
            await paymentService.handlePaymentFailure(paymentId, payload);
        }
    }
    async handleRazorpayWebhook(payload, signature, rawBody) {
        // 1. Verify Signature
        const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
        if (!isValid) {
            paymentLogger.error({ event: 'webhook_invalid_signature' }, 'Razorpay webhook: invalid signature');
            throw new ApiError(401, 'Invalid webhook signature');
        }
        // 2. Parse Event
        const event = payload.event;
        paymentLogger.info({ event: 'webhook_received', webhookEvent: event }, `Razorpay webhook received: ${event}`);
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
        paymentLogger.warn({ event: 'webhook_unhandled', webhookEvent: event }, `Razorpay webhook unhandled event: ${event}`);
    }
    async handleRazorpayPaymentCaptured(payload, signature) {
        const paymentEntity = payload.payload.payment?.entity;
        if (!paymentEntity) {
            paymentLogger.error({ event: 'webhook_missing_entity' }, 'Razorpay webhook: missing payment entity');
            return;
        }
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;
        // Find payment by Razorpay order ID
        const payment = await paymentRepository.findByProviderOrderId(razorpayOrderId);
        if (!payment) {
            paymentLogger.error({ event: 'webhook_payment_not_found', razorpayOrderId }, `Razorpay webhook: payment not found for order ${razorpayOrderId}`);
            return;
        }
        // Idempotency: Skip if already SUCCESS
        if (payment.status === PaymentStatus.SUCCESS) {
            paymentLogger.info({ event: 'webhook_already_success', paymentId: payment.id }, `Razorpay webhook: payment already successful ${payment.id}`);
            return;
        }
        // Log webhook event (always, even if handlePaymentSuccess is idempotent)
        await prisma.paymentEvent.create({
            data: {
                paymentId: payment.id,
                type: PaymentEventType.WEBHOOK,
                payload: payload,
            },
        });
        // Delegate to shared handler — idempotent & race-safe
        await paymentService.handlePaymentSuccess(payment.id, payment.orderId, razorpayPaymentId, { razorpayOrderId, razorpayPaymentId, source: 'webhook' }, signature);
        paymentLogger.info({ event: 'webhook_payment_processed', paymentId: payment.id }, `Razorpay webhook: payment ${payment.id} processed`);
    }
    async handleRazorpayPaymentFailed(payload) {
        const paymentEntity = payload.payload.payment?.entity;
        if (!paymentEntity) {
            paymentLogger.error({ event: 'webhook_missing_entity_failed' }, 'Razorpay webhook: missing payment entity in failed event');
            return;
        }
        const razorpayOrderId = paymentEntity.order_id;
        // Find payment by Razorpay order ID
        const payment = await paymentRepository.findByProviderOrderId(razorpayOrderId);
        if (!payment) {
            paymentLogger.error({ event: 'webhook_payment_not_found_failed', razorpayOrderId }, `Razorpay webhook: payment not found for failed order ${razorpayOrderId}`);
            return;
        }
        // Idempotency: Skip if already in terminal state
        if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) {
            paymentLogger.info({ event: 'webhook_already_terminal', paymentId: payment.id, status: payment.status }, `Razorpay webhook: payment already in terminal state ${payment.id}`);
            return;
        }
        // Delegate to shared failure handler
        await paymentService.handlePaymentFailure(payment.id, payload);
        paymentLogger.info({ event: 'webhook_payment_failed', paymentId: payment.id }, `Razorpay webhook: payment ${payment.id} marked FAILED`);
    }
    mapProvider(provider) {
        const p = provider.toUpperCase();
        if (Object.values(PaymentProvider).includes(p)) {
            return p;
        }
        return null;
    }
}
export const webhookService = new WebhookService();
//# sourceMappingURL=webhook.service.js.map