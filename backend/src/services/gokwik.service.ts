/**
 * GoKwik Service
 *
 * Implements the GoKwik Payment Links API:
 *   - Create a payment link (buyer is redirected to short_url)
 *   - Fetch link status
 *   - Cancel a link
 *   - Verify webhook payloads (HMAC-SHA512)
 *
 * Flow mirrors the redirect-style providers: create → redirect → webhook /
 * status check → confirm. The authoritative state always comes from a
 * server-to-server fetch, never from the redirect itself.
 *
 * Docs: "GoKwik Payment Link API Integration Document v1.0" and
 *       "GoKwik Payment Webhooks (V3) Integration Document".
 */

import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';
import { paymentLogger } from '../config/logger.js';
import { getGoKwikAuthHeaders, getGoKwikBaseUrl, isGoKwikConfigured } from './gokwik.client.js';

/** Payment links expire after this long. Matches our 30-min stale-order TTL. */
const LINK_TTL_SECONDS = 30 * 60;

export type GoKwikLinkStatus = 'created' | 'paid' | 'cancelled' | 'expired';

export interface GoKwikPaymentLink {
    id: string;
    amount: number;
    currency: string;
    merchantReferenceId: string;
    /** Hosted payment page the buyer must be sent to. */
    shortUrl: string;
    status: GoKwikLinkStatus;
    expireAt: number | null;
}

/** Normalized webhook event (transaction.* and refund.*). */
export interface GoKwikWebhookEvent {
    entity: 'transaction' | 'refund' | string;
    event: string;
    hmac: string;
    paymentId: string;
    merchantReferenceId: string;
    amount: number;
    currency: string;
    /** Present on refund events only. */
    refundId?: string;
    transactionPaymentId?: string;
    method?: string;
    provider?: string;
    description?: string | null;
}

interface GoKwikApiEnvelope<T> {
    success: boolean;
    status_code: number;
    timestamp: number;
    data?: T;
    error?: { message?: string; reference?: { statusCode?: number; message?: string } };
}

interface GoKwikLinkData {
    id: string;
    amount: number;
    currency: string;
    merchant_reference_id: string;
    short_url: string;
    status: GoKwikLinkStatus;
    expire_at: number | null;
}

function extractErrorMessage(body: GoKwikApiEnvelope<unknown> | null, fallback: string): string {
    return (
        body?.error?.reference?.message ??
        body?.error?.message ??
        fallback
    );
}

async function goKwikRequest<T>(
    method: 'GET' | 'POST' | 'PATCH',
    path: string,
    body?: unknown,
): Promise<T> {
    if (!isGoKwikConfigured()) {
        throw new ApiError(500, 'GoKwik is not configured');
    }

    let response: Response;
    try {
        response = await fetch(`${getGoKwikBaseUrl()}${path}`, {
            method,
            headers: getGoKwikAuthHeaders(),
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
    } catch (error: any) {
        paymentLogger.error(
            { event: 'gokwik_network_error', path, error: error?.message },
            `GoKwik request failed: ${path}`,
        );
        throw new ApiError(502, 'Unable to reach GoKwik. Please try again.');
    }

    const payload = (await response.json().catch(() => null)) as GoKwikApiEnvelope<T> | null;

    if (!response.ok || !payload?.success) {
        const message = extractErrorMessage(payload, `GoKwik request failed with status ${response.status}`);
        paymentLogger.error(
            { event: 'gokwik_api_error', path, status: response.status, message },
            `GoKwik API error: ${message}`,
        );
        throw new ApiError(502, `GoKwik: ${message}`);
    }

    if (payload.data === undefined) {
        throw new ApiError(502, 'GoKwik returned an empty response');
    }

    return payload.data;
}

function mapLink(data: GoKwikLinkData): GoKwikPaymentLink {
    return {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        merchantReferenceId: data.merchant_reference_id,
        shortUrl: data.short_url,
        status: data.status,
        expireAt: data.expire_at ?? null,
    };
}

export class GoKwikService {

    /**
     * Build a unique merchant reference id for one payment attempt.
     *
     * GoKwik rejects a second link for the same merchant_reference_id
     * ("Payment link for given merchantReferenceId already exists"), so each
     * retry needs its own id. Stored on the payment as providerOrderId.
     */
    buildMerchantReferenceId(orderId: string): string {
        const suffix = Date.now().toString(36).toUpperCase();
        const sanitized = orderId.replace(/[^a-zA-Z0-9_-]/g, '');
        return `${sanitized}_${suffix}`.slice(0, 60);
    }

    /**
     * Create a payment link the buyer will be redirected to.
     *
     * @param amount - Amount in rupees (GoKwik takes major units, not paise)
     * @param merchantReferenceId - Unique id from buildMerchantReferenceId()
     * @param customer - Buyer contact details (phone is mandatory)
     * @param meta - orderId/description carried through for reconciliation
     */
    async createPaymentLink(
        amount: number,
        merchantReferenceId: string,
        customer: { phone: string; name?: string | undefined; email?: string | undefined },
        meta: { orderId: string },
    ): Promise<GoKwikPaymentLink> {
        if (!customer.phone) {
            throw new ApiError(400, 'A phone number is required for GoKwik payments');
        }

        const data = await goKwikRequest<GoKwikLinkData>('POST', '/v1/payments/links', {
            amount,
            currency: 'INR',
            merchant_reference_id: merchantReferenceId,
            mode: env.GOKWIK_PAYMENT_MODE,
            customer: {
                phone: customer.phone,
                ...(customer.name ? { name: customer.name } : {}),
                ...(customer.email ? { email: customer.email } : {}),
            },
            expire_at: Math.floor(Date.now() / 1000) + LINK_TTL_SECONDS,
            description: `Payment for order ${meta.orderId}`,
            ...(this.getWebhookUrl() ? { webhook_url: this.getWebhookUrl() } : {}),
        });

        return mapLink(data);
    }

    /**
     * Fetch the authoritative link state from GoKwik.
     * This is the only trusted confirmation for a redirect-flow payment.
     */
    async getPaymentLink(params: { id?: string; merchantReferenceId?: string }): Promise<GoKwikPaymentLink> {
        const query = params.id
            ? `id=${encodeURIComponent(params.id)}`
            : `merchant_reference_id=${encodeURIComponent(params.merchantReferenceId ?? '')}`;

        const data = await goKwikRequest<GoKwikLinkData>('GET', `/v1/payments/links?${query}`);
        return mapLink(data);
    }

    /** Cancel an unpaid payment link (best-effort; fails if already paid). */
    async cancelPaymentLink(linkId: string): Promise<void> {
        await goKwikRequest('POST', '/v1/payments/links/cancel', { id: linkId });
    }

    /**
     * Attach user-defined fields to a link. udf1/udf2 are reserved by GoKwik
     * for platform + merchant order ids and feed their settlement APIs.
     */
    async upsertUdfs(merchantReferenceId: string, udfs: Record<string, string>): Promise<void> {
        await goKwikRequest('PATCH', '/v1/payments/links/udfs', {
            merchant_reference_id: merchantReferenceId,
            udfs,
        });
    }

    /**
     * Webhook URL GoKwik should post payment events to.
     * Must match the mount path in app.ts: `/v1/payments/webhook/:provider`.
     */
    private getWebhookUrl(): string | null {
        if (!env.BACKEND_PUBLIC_URL) return null;
        return `${env.BACKEND_PUBLIC_URL.replace(/\/$/, '')}/v1/payments/webhook/gokwik`;
    }

    /**
     * Verify a GoKwik webhook payload.
     *
     * GoKwik signs each event with SHA-512 over a pipe-joined string:
     *   transactions: `${merchantReferenceId}|${paymentId}|${amount}|${currency}`
     *   refunds:      `${merchantReferenceId}|${paymentId}|${amount}`
     *
     * The digest is carried inside data.hmac (not a header).
     */
    verifyWebhookHmac(entity: string, data: Record<string, any>): boolean {
        const received = String(data?.hmac ?? '').toLowerCase();
        if (!received) {
            paymentLogger.error({ event: 'gokwik_webhook_missing_hmac' }, 'GoKwik webhook missing hmac');
            return false;
        }

        const signingString =
            entity === 'refund'
                ? `${data.merchantReferenceId}|${data.paymentId}|${data.amount}`
                : `${data.merchantReferenceId}|${data.paymentId}|${data.amount}|${data.currency}`;

        const expected = crypto.createHash('sha512').update(signingString).digest('hex');

        try {
            return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
        } catch {
            // Length mismatch → not a valid digest
            return false;
        }
    }

    /** Normalize a raw webhook body into a flat event. */
    parseWebhookEvent(payload: any): GoKwikWebhookEvent {
        const data = payload?.data ?? {};
        return {
            entity: payload?.entity ?? '',
            event: payload?.event ?? '',
            hmac: data.hmac ?? '',
            paymentId: data.paymentId ?? '',
            merchantReferenceId: data.merchantReferenceId ?? '',
            amount: Number(data.amount ?? 0),
            currency: data.currency ?? 'INR',
            refundId: data.refundId,
            transactionPaymentId: data.transactionPaymentId,
            method: data.method,
            provider: data.provider,
            description: data.description ?? null,
        };
    }
}

export const gokwikService = new GoKwikService();
