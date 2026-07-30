import { PaymentStatus } from '@prisma/client';
export declare class PaymentService {
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
        provider: import(".prisma/client").PaymentProvider;
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