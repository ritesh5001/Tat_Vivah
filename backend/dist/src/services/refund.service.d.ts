import { RefundInitiator, RefundStatus } from '@prisma/client';
interface CreateRefundInput {
    orderId: string;
    /** Amount in paise (integer). 100 paise = ₹1 */
    amount: number;
    reason?: string;
    initiatedBy: RefundInitiator;
}
export declare class RefundService {
    /**
     * Create a refund ledger entry and execute refund via payment provider.
     *
     * Rules:
     *  - Idempotent: if SUCCESS refund for same order+amount exists → returns it
     *  - Over-refund prevention: sum(SUCCESS + PENDING) + amount <= order.totalAmount (in paise)
     *  - PENDING row created inside transaction
     *  - Provider call outside transaction
     *  - Final status update uses optimistic lock (WHERE status = PENDING)
     *  - Failed records are NEVER deleted (immutable audit trail)
     */
    createRefund(input: CreateRefundInput): Promise<{
        status: import(".prisma/client").$Enums.RefundStatus;
        reason: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        paymentId: string;
        amount: number;
        razorpayRefundId: string | null;
        initiatedBy: import(".prisma/client").$Enums.RefundInitiator;
    }>;
    /**
     * List all refunds (admin view).
     */
    listRefunds(filters?: {
        orderId?: string;
        status?: RefundStatus;
    }): Promise<{
        refunds: ({
            order: {
                status: import(".prisma/client").$Enums.OrderStatus;
                id: string;
                totalAmount: number;
            };
            payment: {
                id: string;
                provider: import(".prisma/client").$Enums.PaymentProvider;
                providerPaymentId: string | null;
            };
        } & {
            status: import(".prisma/client").$Enums.RefundStatus;
            reason: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orderId: string;
            paymentId: string;
            amount: number;
            razorpayRefundId: string | null;
            initiatedBy: import(".prisma/client").$Enums.RefundInitiator;
        })[];
    }>;
}
export declare const refundService: RefundService;
export {};
//# sourceMappingURL=refund.service.d.ts.map