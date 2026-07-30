
import { paymentService } from './payment.service.js';
import { PaymentProvider, PaymentStatus, PaymentEventType } from '@prisma/client';
import { ApiError } from '../errors/ApiError.js';
import { phonepeService } from './phonepe.service.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { prisma } from '../config/db.js';
import { paymentLogger } from '../config/logger.js';

export class WebhookService {

    async processWebhook(provider: string, payload: any, signature: string) {
        const p = provider.toUpperCase();
        if (p !== PaymentProvider.PHONEPE) {
            throw new ApiError(400, 'Provider webhook not implemented');
        }
        await this.handlePhonePeWebhook(payload, signature);
    }

    // ------------------------------------------------------------------
    // PhonePe webhook
    //
    // Auth: PhonePe sends Authorization: SHA256(username:password). The webhook
    // is a hint — success is re-confirmed via the Order Status API before we
    // mark the payment SUCCESS.
    // ------------------------------------------------------------------

    private async handlePhonePeWebhook(payload: any, authorizationHeader: string) {
        if (!phonepeService.verifyWebhookAuthorization(authorizationHeader)) {
            paymentLogger.error({ event: 'phonepe_webhook_invalid_auth' }, 'PhonePe webhook: invalid authorization');
            throw new ApiError(401, 'Invalid webhook authorization');
        }

        const event = phonepeService.parseWebhookEvent(payload);
        paymentLogger.info(
            { event: 'phonepe_webhook_received', webhookEvent: event.event, merchantOrderId: event.merchantOrderId },
            `PhonePe webhook received: ${event.event}`,
        );

        if (!event.event.startsWith('checkout.order.')) {
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

        const payment = await paymentRepository.findByProviderOrderId(event.merchantOrderId);
        if (!payment) {
            // Expected for orders that were never created through this app (e.g.
            // direct API tests on the same merchant account). Not an app error —
            // we acknowledge the webhook and skip it.
            paymentLogger.warn(
                { event: 'phonepe_webhook_payment_not_found', merchantOrderId: event.merchantOrderId },
                `PhonePe webhook: no local payment for ${event.merchantOrderId} — skipping`,
            );
            return;
        }

        if (payment.status === PaymentStatus.SUCCESS) {
            return; // idempotent
        }

        await prisma.paymentEvent.create({
            data: { paymentId: payment.id, type: PaymentEventType.WEBHOOK, payload: payload as any },
        });

        if (event.event === 'checkout.order.completed' && event.state === 'COMPLETED') {
            // Re-confirm with the status API before trusting the webhook.
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
                { merchantOrderId: event.merchantOrderId, phonepeOrderId: status.orderId, source: 'webhook' },
            );
            return;
        }

        if (event.event === 'checkout.order.failed') {
            if (payment.status === PaymentStatus.FAILED) return;
            await paymentService.handlePaymentFailure(payment.id, {
                merchantOrderId: event.merchantOrderId,
                source: 'webhook',
            });
        }
    }
}

export const webhookService = new WebhookService();
