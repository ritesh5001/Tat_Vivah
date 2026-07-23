
import { paymentService } from './payment.service.js';
import { PaymentProvider, PaymentStatus, PaymentEventType } from '@prisma/client';
import { ApiError } from '../errors/ApiError.js';
import { razorpayService, RazorpayWebhookPayload } from './razorpay.service.js';
import { phonepeService } from './phonepe.service.js';
import { gokwikService } from './gokwik.service.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { prisma } from '../config/db.js';
import { paymentLogger } from '../config/logger.js';

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

        // 4. Handle PHONEPE Provider
        if (validProvider === PaymentProvider.PHONEPE) {
            await this.handlePhonePeWebhook(payload, signature);
            return;
        }

        // 5. Handle GOKWIK Provider
        if (validProvider === PaymentProvider.GOKWIK) {
            await this.handleGoKwikWebhook(payload);
            return;
        }

        throw new ApiError(400, 'Provider webhook not implemented');
    }

    private async handleMockWebhook(payload: any) {
        const { paymentId, status, providerPaymentId } = payload;

        if (status === 'SUCCESS') {
            // Look up orderId for the shared handler
            const payment = await paymentRepository.findPaymentById(paymentId);
            if (payment) {
                await paymentService.handlePaymentSuccess(paymentId, payment.orderId, providerPaymentId, payload);
            }
        } else if (status === 'FAILED') {
            await paymentService.handlePaymentFailure(paymentId, payload);
        }
    }

    private async handleRazorpayWebhook(payload: RazorpayWebhookPayload, signature: string, rawBody: string) {
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

    private async handleRazorpayPaymentCaptured(payload: RazorpayWebhookPayload, signature: string) {
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
                payload: payload as any,
            },
        });

        // Delegate to shared handler — idempotent & race-safe
        await paymentService.handlePaymentSuccess(
            payment.id,
            payment.orderId,
            razorpayPaymentId,
            { razorpayOrderId, razorpayPaymentId, source: 'webhook' },
            signature
        );

        paymentLogger.info({ event: 'webhook_payment_processed', paymentId: payment.id }, `Razorpay webhook: payment ${payment.id} processed`);
    }

    private async handleRazorpayPaymentFailed(payload: RazorpayWebhookPayload) {
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

    // ------------------------------------------------------------------
    // PhonePe webhook
    //
    // Auth: PhonePe sends Authorization: SHA256(username:password) where the
    // credentials are configured on the PhonePe dashboard. The webhook is a
    // hint only — the authoritative state always comes from a server-to-server
    // Order Status call before we mark the payment SUCCESS.
    // ------------------------------------------------------------------

    private async handlePhonePeWebhook(payload: any, authorizationHeader: string) {
        // 1. Verify Authorization
        const isValid = phonepeService.verifyWebhookAuthorization(authorizationHeader);
        if (!isValid) {
            paymentLogger.error({ event: 'phonepe_webhook_invalid_auth' }, 'PhonePe webhook: invalid authorization');
            throw new ApiError(401, 'Invalid webhook authorization');
        }

        // 2. Parse Event
        const event = phonepeService.parseWebhookEvent(payload);
        paymentLogger.info(
            { event: 'phonepe_webhook_received', webhookEvent: event.event, merchantOrderId: event.merchantOrderId },
            `PhonePe webhook received: ${event.event}`,
        );

        const isOrderEvent = event.event.startsWith('checkout.order.');
        if (!isOrderEvent) {
            // Refund and other lifecycle events are logged for audit only —
            // refund state is already tracked optimistically at initiation.
            paymentLogger.info(
                { event: 'phonepe_webhook_unhandled', webhookEvent: event.event },
                `PhonePe webhook unhandled event: ${event.event}`,
            );
            return;
        }

        if (!event.merchantOrderId) {
            paymentLogger.error({ event: 'phonepe_webhook_missing_order' }, 'PhonePe webhook: missing merchantOrderId');
            return;
        }

        // 3. Find payment by merchantOrderId (stored as providerOrderId)
        const payment = await paymentRepository.findByProviderOrderId(event.merchantOrderId);
        if (!payment) {
            paymentLogger.error(
                { event: 'phonepe_webhook_payment_not_found', merchantOrderId: event.merchantOrderId },
                `PhonePe webhook: payment not found for ${event.merchantOrderId}`,
            );
            return;
        }

        // Idempotency: skip if already in terminal state
        if (payment.status === PaymentStatus.SUCCESS) {
            paymentLogger.info(
                { event: 'phonepe_webhook_already_success', paymentId: payment.id },
                `PhonePe webhook: payment already successful ${payment.id}`,
            );
            return;
        }

        // Log webhook event for audit
        await prisma.paymentEvent.create({
            data: {
                paymentId: payment.id,
                type: PaymentEventType.WEBHOOK,
                payload: payload as any,
            },
        });

        if (event.event === 'checkout.order.completed' && event.state === 'COMPLETED') {
            // Re-confirm with the Order Status API before trusting the webhook
            const status = await phonepeService.getOrderStatus(event.merchantOrderId);
            if (status.state !== 'COMPLETED') {
                paymentLogger.warn(
                    { event: 'phonepe_webhook_state_mismatch', merchantOrderId: event.merchantOrderId, state: status.state },
                    'PhonePe webhook: status API disagrees with webhook, skipping',
                );
                return;
            }

            const transactionId =
                status.paymentDetails?.[0]?.transactionId ?? event.transactionId ?? status.orderId;

            await paymentService.handlePaymentSuccess(
                payment.id,
                payment.orderId,
                transactionId,
                {
                    merchantOrderId: event.merchantOrderId,
                    phonepeOrderId: status.orderId,
                    transactionId,
                    source: 'webhook',
                },
            );

            paymentLogger.info(
                { event: 'phonepe_webhook_payment_processed', paymentId: payment.id },
                `PhonePe webhook: payment ${payment.id} processed`,
            );
            return;
        }

        if (event.event === 'checkout.order.failed') {
            if (payment.status === PaymentStatus.FAILED) return;
            await paymentService.handlePaymentFailure(payment.id, {
                merchantOrderId: event.merchantOrderId,
                source: 'webhook',
            });
            paymentLogger.info(
                { event: 'phonepe_webhook_payment_failed', paymentId: payment.id },
                `PhonePe webhook: payment ${payment.id} marked FAILED`,
            );
        }
    }

    // ------------------------------------------------------------------
    // GoKwik webhook (Payment Webhooks V3)
    //
    // Auth: each event carries an HMAC-SHA512 digest inside data.hmac,
    // computed over pipe-joined fields. The webhook is treated as a hint —
    // success is re-confirmed against the Payment Links status API before we
    // mark anything paid.
    // ------------------------------------------------------------------

    private async handleGoKwikWebhook(payload: any) {
        const event = gokwikService.parseWebhookEvent(payload);

        // 1. Verify HMAC
        if (!gokwikService.verifyWebhookHmac(event.entity, payload?.data ?? {})) {
            paymentLogger.error(
                { event: 'gokwik_webhook_invalid_hmac', webhookEvent: event.event },
                'GoKwik webhook: invalid hmac',
            );
            throw new ApiError(401, 'Invalid webhook signature');
        }

        paymentLogger.info(
            {
                event: 'gokwik_webhook_received',
                webhookEvent: event.event,
                merchantReferenceId: event.merchantReferenceId,
            },
            `GoKwik webhook received: ${event.event}`,
        );

        if (!event.merchantReferenceId) {
            paymentLogger.error({ event: 'gokwik_webhook_missing_ref' }, 'GoKwik webhook: missing merchantReferenceId');
            return;
        }

        // 2. Find payment by merchantReferenceId (stored as providerOrderId)
        const payment = await paymentRepository.findByProviderOrderId(event.merchantReferenceId);
        if (!payment) {
            paymentLogger.error(
                { event: 'gokwik_webhook_payment_not_found', merchantReferenceId: event.merchantReferenceId },
                `GoKwik webhook: payment not found for ${event.merchantReferenceId}`,
            );
            return;
        }

        // 3. Log the event for audit (before any state change)
        await prisma.paymentEvent.create({
            data: {
                paymentId: payment.id,
                type: PaymentEventType.WEBHOOK,
                payload: payload as any,
            },
        });

        // ── Refund events: ledger is already handled at initiation time,
        //    so these are recorded for audit only.
        if (event.entity === 'refund') {
            paymentLogger.info(
                { event: 'gokwik_webhook_refund', webhookEvent: event.event, paymentId: payment.id },
                `GoKwik refund webhook: ${event.event}`,
            );
            return;
        }

        // ── Transaction events
        if (event.event === 'transaction.successful') {
            if (payment.status === PaymentStatus.SUCCESS) {
                paymentLogger.info(
                    { event: 'gokwik_webhook_already_success', paymentId: payment.id },
                    `GoKwik webhook: payment already successful ${payment.id}`,
                );
                return;
            }

            // Re-confirm with the status API before trusting the webhook.
            const link = await gokwikService.getPaymentLink({
                merchantReferenceId: event.merchantReferenceId,
            });
            if (link.status !== 'paid') {
                paymentLogger.warn(
                    {
                        event: 'gokwik_webhook_state_mismatch',
                        merchantReferenceId: event.merchantReferenceId,
                        linkStatus: link.status,
                    },
                    'GoKwik webhook: status API disagrees with webhook, skipping',
                );
                return;
            }

            await paymentService.handlePaymentSuccess(
                payment.id,
                payment.orderId,
                event.paymentId || link.id,
                {
                    merchantReferenceId: event.merchantReferenceId,
                    gokwikPaymentId: event.paymentId,
                    method: event.method,
                    provider: event.provider,
                    source: 'webhook',
                },
            );

            paymentLogger.info(
                { event: 'gokwik_webhook_payment_processed', paymentId: payment.id },
                `GoKwik webhook: payment ${payment.id} processed`,
            );
            return;
        }

        if (event.event === 'transaction.failure' || event.event === 'transaction.auto_refund') {
            // Never downgrade a successful payment (auto_refund is handled by
            // the refund ledger, not by flipping the payment back to FAILED).
            if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) {
                return;
            }

            await paymentService.handlePaymentFailure(payment.id, {
                merchantReferenceId: event.merchantReferenceId,
                reason: event.description,
                source: 'webhook',
            });

            paymentLogger.info(
                { event: 'gokwik_webhook_payment_failed', paymentId: payment.id },
                `GoKwik webhook: payment ${payment.id} marked FAILED`,
            );
            return;
        }

        paymentLogger.warn(
            { event: 'gokwik_webhook_unhandled', webhookEvent: event.event },
            `GoKwik webhook unhandled event: ${event.event}`,
        );
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

