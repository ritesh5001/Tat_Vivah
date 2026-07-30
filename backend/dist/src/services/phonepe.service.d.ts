/**
 * PhonePe Service — Standard Checkout v2.
 *
 * - Create a hosted checkout order (buyer is redirected to redirectUrl)
 * - Poll order status (the trusted, server-to-server confirmation)
 * - Initiate refunds
 * - Verify webhook authorization
 */
export type PhonePeOrderState = 'PENDING' | 'COMPLETED' | 'FAILED';
export interface PhonePeCreateOrderResponse {
    phonepeOrderId: string;
    state: PhonePeOrderState;
    redirectUrl: string;
    merchantOrderId: string;
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
    phonepeOrderId?: string;
    state?: string;
    amount?: number;
    transactionId?: string;
}
export declare class PhonePeService {
    /**
     * Build a unique merchant order id for one payment attempt.
     * PhonePe requires uniqueness per /pay call, so each retry gets a suffix.
     * Stored as payment.providerOrderId for later lookup.
     */
    buildMerchantOrderId(orderId: string): string;
    /**
     * Create a PhonePe Standard Checkout order.
     * @param amount - rupees (converted to paise internally)
     */
    createOrder(amount: number, merchantOrderId: string, redirectUrl: string, meta?: {
        orderId?: string;
        userId?: string;
    }): Promise<PhonePeCreateOrderResponse>;
    /** Fetch the authoritative order state from PhonePe. */
    getOrderStatus(merchantOrderId: string): Promise<PhonePeOrderStatusResponse>;
    /**
     * Initiate a refund against a completed PhonePe order.
     * @param amount - rupees
     */
    initiateRefund(merchantRefundId: string, originalMerchantOrderId: string, amount: number): Promise<{
        refundId: string;
        state: string;
    }>;
    /**
     * Verify the Authorization header on a PhonePe webhook.
     * PhonePe sends SHA256(username:password) where the pair is configured on
     * the dashboard and mirrored in PHONEPE_WEBHOOK_USERNAME / _PASSWORD.
     */
    verifyWebhookAuthorization(authorizationHeader: string): boolean;
    /** Normalize a PhonePe webhook body into a flat event. */
    parseWebhookEvent(payload: any): PhonePeWebhookEvent;
}
export declare const phonepeService: PhonePeService;
//# sourceMappingURL=phonepe.service.d.ts.map