/**
 * Razorpay Service
 *
 * Handles Razorpay-specific operations:
 * - Creating Razorpay orders
 * - Verifying webhook signatures
 */
export interface RazorpayOrderResponse {
    razorpayOrderId: string;
    amount: number;
    currency: string;
    key: string;
    orderId: string;
}
export interface RazorpayWebhookPayload {
    event: string;
    payload: {
        payment?: {
            entity: {
                id: string;
                order_id: string;
                amount: number;
                currency: string;
                status: string;
                method: string;
            };
        };
        order?: {
            entity: {
                id: string;
                receipt: string;
                amount: number;
                status: string;
            };
        };
    };
}
export declare class RazorpayService {
    /**
     * Create a Razorpay order
     *
     * @param amount - Amount in smallest currency unit (paise for INR)
     * @param currency - Currency code (default: INR)
     * @param receipt - Unique receipt ID (usually our order ID)
     * @param notes - Additional notes to attach to the order
     */
    createOrder(amount: number, currency: string | undefined, receipt: string, notes?: Record<string, string>): Promise<RazorpayOrderResponse>;
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
    verifyWebhookSignature(body: string, signature: string): boolean;
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
    verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean;
    /**
     * Parse Razorpay webhook event
     */
    parseWebhookEvent(payload: RazorpayWebhookPayload): {
        event: string;
        paymentId?: string;
        orderId?: string;
        amount?: number;
        status?: string;
    };
}
export declare const razorpayService: RazorpayService;
//# sourceMappingURL=razorpay.service.d.ts.map