/**
 * Razorpay Service
 *
 * Handles Razorpay-specific operations:
 * - Creating Razorpay orders
 * - Verifying webhook signatures
 */
import crypto from 'crypto';
import { razorpayClient, isRazorpayConfigured, getRazorpayKeyId } from './razorpay.client.js';
import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';
export class RazorpayService {
    /**
     * Create a Razorpay order
     *
     * @param amount - Amount in smallest currency unit (paise for INR)
     * @param currency - Currency code (default: INR)
     * @param receipt - Unique receipt ID (usually our order ID)
     * @param notes - Additional notes to attach to the order
     */
    async createOrder(amount, currency = 'INR', receipt, notes) {
        if (!isRazorpayConfigured() || !razorpayClient) {
            throw new ApiError(500, 'Razorpay is not configured');
        }
        try {
            // Amount should be in paise (multiply by 100 if passing rupees)
            const amountInPaise = Math.round(amount * 100);
            const order = await razorpayClient.orders.create({
                amount: amountInPaise,
                currency,
                receipt,
                notes: notes || {},
            });
            return {
                razorpayOrderId: order.id,
                amount: amountInPaise,
                currency: order.currency,
                key: getRazorpayKeyId(),
                orderId: receipt,
            };
        }
        catch (error) {
            console.error('[Razorpay] Order creation failed:', error);
            throw new ApiError(500, `Razorpay order creation failed: ${error.message || 'Unknown error'}`);
        }
    }
    /**
     * Verify Razorpay webhook signature
     *
     * Razorpay sends a signature in the `x-razorpay-signature` header.
     * We verify it using HMAC SHA256 with the webhook secret.
     *
     * @param body - Raw request body (string)
     * @param signature - Signature from x-razorpay-signature header
     * @returns true if signature is valid
     */
    verifyWebhookSignature(body, signature) {
        if (!env.RAZORPAY_WEBHOOK_SECRET) {
            console.error('[Razorpay] Webhook secret not configured');
            return false;
        }
        try {
            const expectedSignature = crypto
                .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
                .update(body)
                .digest('hex');
            return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            console.error('[Razorpay] Signature verification error:', error);
            return false;
        }
    }
    /**
     * Verify payment signature (for client-side verification)
     *
     * After payment completion on frontend, verify the payment signature
     * to ensure the payment is authentic.
     *
     * @param razorpayOrderId - Razorpay order ID
     * @param razorpayPaymentId - Razorpay payment ID
     * @param razorpaySignature - Signature from Razorpay
     */
    verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        if (!env.RAZORPAY_KEY_SECRET) {
            console.error('[Razorpay] Key secret not configured');
            return false;
        }
        try {
            const body = `${razorpayOrderId}|${razorpayPaymentId}`;
            const expectedSignature = crypto
                .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
                .update(body)
                .digest('hex');
            return crypto.timingSafeEqual(Buffer.from(razorpaySignature), Buffer.from(expectedSignature));
        }
        catch (error) {
            console.error('[Razorpay] Payment signature verification error:', error);
            return false;
        }
    }
    /**
     * Parse Razorpay webhook event
     */
    parseWebhookEvent(payload) {
        const result = { event: payload.event };
        if (payload.payload.payment?.entity) {
            const payment = payload.payload.payment.entity;
            result.paymentId = payment.id;
            result.orderId = payment.order_id;
            result.amount = payment.amount;
            result.status = payment.status;
        }
        if (payload.payload.order?.entity) {
            const order = payload.payload.order.entity;
            result.orderId = result.orderId || order.id;
            result.receipt = order.receipt;
        }
        return result;
    }
}
export const razorpayService = new RazorpayService();
//# sourceMappingURL=razorpay.service.js.map