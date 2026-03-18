import { CancellationStatus } from '@prisma/client';
export declare class CancellationService {
    private isRetryableTransactionError;
    requestCancellation(userId: string, orderId: string, reason: string): Promise<{
        order: {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            userId: string;
        };
    } & {
        reason: string;
        status: import(".prisma/client").$Enums.CancellationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        rejectionReason: string | null;
        orderId: string;
    }>;
    getMyCancellations(userId: string): Promise<{
        cancellations: ({
            order: {
                status: import(".prisma/client").$Enums.OrderStatus;
                id: string;
                createdAt: Date;
                totalAmount: number;
            };
        } & {
            reason: string;
            status: import(".prisma/client").$Enums.CancellationStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            reviewedBy: string | null;
            reviewedAt: Date | null;
            rejectionReason: string | null;
            orderId: string;
        })[];
    }>;
    listCancellations(filters: {
        status?: CancellationStatus;
        userId?: string;
        orderId?: string;
    }): Promise<{
        cancellations: ({
            user: {
                id: string;
                email: string | null;
                user_profiles: {
                    full_name: string;
                } | null;
            };
            order: {
                status: import(".prisma/client").$Enums.OrderStatus;
                id: string;
                createdAt: Date;
                payment: {
                    status: import(".prisma/client").$Enums.PaymentStatus;
                } | null;
                totalAmount: number;
            };
        } & {
            reason: string;
            status: import(".prisma/client").$Enums.CancellationStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            reviewedBy: string | null;
            reviewedAt: Date | null;
            rejectionReason: string | null;
            orderId: string;
        })[];
    }>;
    approveCancellation(adminId: string, cancellationId: string): Promise<{
        success: boolean;
        orderId: string;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus | null;
        refundTriggered: boolean;
        alreadyCancelled: boolean;
    }>;
    approveCancellationBySeller(sellerId: string, cancellationId: string): Promise<{
        success: boolean;
        orderId: string;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus | null;
        refundTriggered: boolean;
        alreadyCancelled: boolean;
    }>;
    private approveCancellationInternal;
    rejectCancellation(adminId: string, cancellationId: string, reason?: string): Promise<{
        success: boolean;
        cancellationId: string;
        orderId: string;
        alreadyRejected: boolean;
    }>;
}
export declare const cancellationService: CancellationService;
//# sourceMappingURL=cancellation.service.d.ts.map