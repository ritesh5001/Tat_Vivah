import { PaymentStatus, PaymentProvider } from '@prisma/client';
/** Where the buyer lands after a PhonePe redirect-flow payment. */
export type PaymentPlatform = 'WEB' | 'MOBILE';
export declare class PaymentService {
    private findOrderForPayment;
    private resolvePayableAmount;
    /**
     * Where PhonePe redirects the buyer after checkout.
     * WEB → frontend callback page; MOBILE → app deep link (if configured).
     */
    private buildPhonePeRedirectUrl;
    initiatePayment(userId: string, orderId: string, platform?: PaymentPlatform): Promise<{
        paymentId: string;
        orderId: string;
        phonepeOrderId: string;
        redirectUrl: string;
        amount: number;
        currency: string;
        provider: string;
    }>;
    /** Retry payment for a PLACED order whose payment is FAILED/INITIATED. */
    retryPayment(userId: string, orderId: string, platform?: PaymentPlatform): Promise<{
        paymentId: string;
        orderId: string;
        phonepeOrderId: string;
        redirectUrl: string;
        amount: number;
        currency: string;
        provider: string;
    }>;
    verifyPhonePePayment(userId: string, orderId: string): Promise<{
        status: 'SUCCESS' | 'FAILED' | 'PENDING';
        paymentId: string;
        message: string;
    }>;
    processRefund(orderId: string): Promise<{
        refundTriggered: boolean;
        alreadyRefunded: boolean;
        paymentStatus: PaymentStatus | null;
    }>;
    getPaymentDetails(orderId: string, userId: string): Promise<{
        id: string;
        orderId: string;
        userId: string;
        amount: number;
        currency: string;
        status: PaymentStatus;
        provider: PaymentProvider;
        providerOrderId: string | null;
        providerPaymentId: string | null;
        providerSignature: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    handlePaymentSuccess(paymentId: string, orderId: string, providerPaymentId: string, payload: any, providerSignature?: string): Promise<void>;
    handlePaymentFailure(paymentId: string, payload: any): Promise<void>;
    cancelStaleOrders(): Promise<{
        cancelled: number;
        total: number;
    }>;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=payment.service.d.ts.map