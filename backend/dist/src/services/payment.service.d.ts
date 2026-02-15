import { PaymentProvider, PaymentStatus } from '@prisma/client';
export declare class PaymentService {
    processRefund(orderId: string): Promise<{
        refundTriggered: boolean;
        alreadyRefunded: boolean;
        paymentStatus: PaymentStatus | null;
    }>;
    initiatePayment(userId: string, orderId: string, provider: PaymentProvider): Promise<{
        paymentId: string;
        providerPaymentId: string;
        checkoutUrl: string;
        amount: number;
        currency: string;
        orderId?: never;
        key?: never;
        provider?: never;
    } | {
        paymentId: string;
        orderId: string;
        amount: number;
        currency: string;
        key: string;
        provider: string;
        providerPaymentId?: never;
        checkoutUrl?: never;
    }>;
    retryPayment(userId: string, orderId: string): Promise<{
        paymentId: string;
        providerPaymentId: string;
        checkoutUrl: string;
        amount: number;
        currency: string;
        orderId?: never;
        key?: never;
        provider?: never;
    } | {
        paymentId: string;
        orderId: string;
        amount: number;
        currency: string;
        key: string;
        provider: string;
        providerPaymentId?: never;
        checkoutUrl?: never;
    }>;
    getPaymentDetails(orderId: string, userId: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        orderId: string;
        amount: number;
        currency: string;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerOrderId: string | null;
        providerPaymentId: string | null;
        providerSignature: string | null;
    }>;
    verifyRazorpayPayment(userId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<{
        message: string;
        paymentId: string;
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