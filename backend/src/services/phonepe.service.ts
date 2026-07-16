/**
 * PhonePe Service
 *
 * Handles PhonePe Standard Checkout v2 operations:
 * - Creating checkout orders (redirect flow)
 * - Polling order status (server-to-server verification)
 * - Initiating refunds
 * - Verifying webhook authorization
 */

import crypto from 'crypto';
import {
    getPhonePeAccessToken,
    getPhonePeApiBaseUrl,
    invalidatePhonePeToken,
    isPhonePeConfigured,
} from './phonepe.client.js';
import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';
import { paymentLogger } from '../config/logger.js';

/** Checkout order expiry passed to PhonePe (seconds). Matches our 30-min stale-order TTL. */
const ORDER_EXPIRE_AFTER_SECONDS = 30 * 60;

export type PhonePeOrderState = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface PhonePeCreateOrderResponse {
    /** PhonePe's own order id (OMO...). */
    phonepeOrderId: string;
    state: PhonePeOrderState;
    /** Hosted checkout page the buyer must be redirected to. */
    redirectUrl: string;
    /** The merchant order id we generated for this attempt. */
    merchantOrderId: string;
    /** Amount in paise. */
    amount: number;
}

export interface PhonePeOrderStatusResponse {
    orderId: string;
    state: PhonePeOrderState;
    amount: number;
    paymentDetails?: Array<{
        transactionId?: string;
        paymentMode?: string;
        state?: string;
        amount?: number;
        timestamp?: number;
        errorCode?: string;
        detailedErrorCode?: string;
    }>;
}

export interface PhonePeWebhookEvent {
    event: string;
    merchantOrderId?: string;
    merchantRefundId?: string;
    phonepeOrderId?: string;
    state?: string;
    amount?: number;
    transactionId?: string;
}

async function phonePeRequest<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    isRetry = false,
): Promise<T> {
    const token = await getPhonePeAccessToken();
    const response = await fetch(`${getPhonePeApiBaseUrl()}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `O-Bearer ${token}`,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    // Token may have been revoked server-side — refresh once and retry.
    if (response.status === 401 && !isRetry) {
        invalidatePhonePeToken();
        return phonePeRequest<T>(method, path, body, true);
    }

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        paymentLogger.error(
            { event: 'phonepe_api_error', path, status: response.status, body: text.slice(0, 500) },
            `PhonePe API request failed: ${path}`,
        );
        throw new ApiError(502, `PhonePe API request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
}

export class PhonePeService {

    /**
     * Build a unique merchant order id for one payment attempt.
     *
     * PhonePe requires merchantOrderId to be unique per /pay call, but our
     * internal order can be retried — so each attempt gets its own suffix.
     * The result is stored in payment.providerOrderId for later lookup.
     */
    buildMerchantOrderId(orderId: string): string {
        const suffix = Date.now().toString(36);
        // PhonePe allows max 63 chars, alphanumeric plus '-' and '_'
        const sanitized = orderId.replace(/[^a-zA-Z0-9_-]/g, '');
        return `${sanitized}_${suffix}`.slice(0, 63);
    }

    /**
     * Create a PhonePe Standard Checkout order.
     *
     * @param amount - Amount in rupees (converted to paise internally)
     * @param merchantOrderId - Unique id from buildMerchantOrderId()
     * @param redirectUrl - Where PhonePe sends the buyer after payment
     * @param meta - udf fields persisted with the PhonePe order
     */
    async createOrder(
        amount: number,
        merchantOrderId: string,
        redirectUrl: string,
        meta?: { orderId?: string; userId?: string },
    ): Promise<PhonePeCreateOrderResponse> {
        if (!isPhonePeConfigured()) {
            throw new ApiError(500, 'PhonePe is not configured');
        }

        const amountInPaise = Math.round(amount * 100);

        try {
            const data = await phonePeRequest<{
                orderId: string;
                state: PhonePeOrderState;
                redirectUrl: string;
            }>('POST', '/checkout/v2/pay', {
                merchantOrderId,
                amount: amountInPaise,
                expireAfter: ORDER_EXPIRE_AFTER_SECONDS,
                metaInfo: {
                    udf1: meta?.orderId ?? '',
                    udf2: meta?.userId ?? '',
                },
                paymentFlow: {
                    type: 'PG_CHECKOUT',
                    message: 'TatVivah order payment',
                    merchantUrls: {
                        redirectUrl,
                    },
                },
            });

            if (!data.redirectUrl) {
                throw new ApiError(502, 'PhonePe did not return a checkout URL');
            }

            return {
                phonepeOrderId: data.orderId,
                state: data.state,
                redirectUrl: data.redirectUrl,
                merchantOrderId,
                amount: amountInPaise,
            };
        } catch (error: any) {
            if (error instanceof ApiError) throw error;
            paymentLogger.error(
                { event: 'phonepe_order_failed', merchantOrderId, error: error?.message },
                'PhonePe order creation failed',
            );
            throw new ApiError(502, `PhonePe order creation failed: ${error?.message ?? 'Unknown error'}`);
        }
    }

    /**
     * Fetch the authoritative order state from PhonePe.
     * This is the only trusted way to confirm a redirect-flow payment.
     */
    async getOrderStatus(merchantOrderId: string): Promise<PhonePeOrderStatusResponse> {
        if (!isPhonePeConfigured()) {
            throw new ApiError(500, 'PhonePe is not configured');
        }

        return phonePeRequest<PhonePeOrderStatusResponse>(
            'GET',
            `/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`,
        );
    }

    /**
     * Initiate a refund against a completed PhonePe order.
     *
     * @param merchantRefundId - Unique refund id (our refund/payment id)
     * @param originalMerchantOrderId - merchantOrderId of the original payment
     * @param amount - Refund amount in rupees
     */
    async initiateRefund(
        merchantRefundId: string,
        originalMerchantOrderId: string,
        amount: number,
    ): Promise<{ refundId: string; state: string }> {
        if (!isPhonePeConfigured()) {
            throw new ApiError(500, 'PhonePe is not configured');
        }

        const sanitizedRefundId = merchantRefundId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 63);

        const data = await phonePeRequest<{ refundId: string; state: string; amount: number }>(
            'POST',
            '/payments/v2/refund',
            {
                merchantRefundId: sanitizedRefundId,
                originalMerchantOrderId,
                amount: Math.round(amount * 100),
            },
        );

        return { refundId: data.refundId, state: data.state };
    }

    /**
     * Verify the Authorization header on a PhonePe webhook.
     *
     * PhonePe sends: Authorization: SHA256(username:password)
     * where username/password are configured on the PhonePe dashboard and
     * mirrored in PHONEPE_WEBHOOK_USERNAME / PHONEPE_WEBHOOK_PASSWORD.
     */
    verifyWebhookAuthorization(authorizationHeader: string): boolean {
        if (!env.PHONEPE_WEBHOOK_USERNAME || !env.PHONEPE_WEBHOOK_PASSWORD) {
            paymentLogger.error(
                { event: 'phonepe_webhook_credentials_missing' },
                'PhonePe webhook credentials not configured',
            );
            return false;
        }
        if (!authorizationHeader) {
            return false;
        }

        const expected = crypto
            .createHash('sha256')
            .update(`${env.PHONEPE_WEBHOOK_USERNAME}:${env.PHONEPE_WEBHOOK_PASSWORD}`)
            .digest('hex');

        // Header may arrive as "SHA256 <hash>" or just the hash
        const received = authorizationHeader.replace(/^sha256\s+/i, '').trim().toLowerCase();

        try {
            return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
        } catch {
            return false;
        }
    }

    /**
     * Normalize a PhonePe webhook body into a flat event.
     * Handles both `event` and `type` keys defensively.
     */
    parseWebhookEvent(payload: any): PhonePeWebhookEvent {
        const event: string = payload?.event ?? payload?.type ?? '';
        const inner = payload?.payload ?? {};
        const paymentDetail = Array.isArray(inner.paymentDetails) ? inner.paymentDetails[0] : undefined;

        return {
            event,
            merchantOrderId: inner.merchantOrderId ?? inner.originalMerchantOrderId,
            merchantRefundId: inner.merchantRefundId,
            phonepeOrderId: inner.orderId,
            state: inner.state,
            amount: inner.amount,
            transactionId: paymentDetail?.transactionId,
        };
    }
}

export const phonepeService = new PhonePeService();
