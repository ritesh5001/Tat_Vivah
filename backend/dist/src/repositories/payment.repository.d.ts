import { Payment, PaymentEvent, PaymentStatus, PaymentEventType } from '@prisma/client';
export declare class PaymentRepository {
    createPayment(data: {
        orderId: string;
        userId: string;
        amount: number;
        currency: string;
        provider: any;
        status: PaymentStatus;
        providerOrderId?: string;
    }): Promise<Payment>;
    findPaymentByOrderId(orderId: string): Promise<Payment | null>;
    findPaymentById(paymentId: string): Promise<Payment | null>;
    findByProviderOrderId(providerOrderId: string): Promise<Payment | null>;
    updatePaymentStatus(paymentId: string, status: PaymentStatus, providerPaymentId?: string | null): Promise<Payment>;
    updateProviderOrderId(paymentId: string, providerOrderId: string): Promise<Payment>;
    updatePaymentWithSignature(paymentId: string, status: PaymentStatus, providerPaymentId: string, providerSignature?: string): Promise<Payment>;
    createPaymentEvent(data: {
        paymentId: string;
        type: PaymentEventType;
        payload?: any;
    }): Promise<PaymentEvent>;
}
export declare const paymentRepository: PaymentRepository;
//# sourceMappingURL=payment.repository.d.ts.map