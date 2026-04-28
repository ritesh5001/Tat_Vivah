import { ReturnStatus } from '@prisma/client';
interface ReturnItemInput {
    orderItemId: string;
    quantity: number;
    reason?: string | undefined;
}
export declare class ReturnService {
    requestReturn(userId: string, orderId: string, reason: string, items: ReturnItemInput[]): Promise<{
        items: {
            variantId: string;
            reason: string | null;
            id: string;
            quantity: number;
            returnRequestId: string;
            orderItemId: string;
        }[];
    } & {
        status: import(".prisma/client").$Enums.ReturnStatus;
        reason: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        rejectionReason: string | null;
        orderId: string;
        refundAmount: number | null;
    }>;
    getMyReturns(userId: string): Promise<{
        returns: unknown[];
    }>;
    getReturnById(userId: string, returnId: string): Promise<{
        order: {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            createdAt: Date;
            totalAmount: number;
        };
        items: ({
            orderItem: {
                variantId: string;
                id: string;
                productId: string;
                quantity: number;
                priceSnapshot: number;
            };
        } & {
            variantId: string;
            reason: string | null;
            id: string;
            quantity: number;
            returnRequestId: string;
            orderItemId: string;
        })[];
    } & {
        status: import(".prisma/client").$Enums.ReturnStatus;
        reason: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        rejectionReason: string | null;
        orderId: string;
        refundAmount: number | null;
    }>;
    listReturns(filters: {
        status?: ReturnStatus;
        userId?: string;
        orderId?: string;
    }): Promise<{
        returns: unknown[];
    }>;
    approveReturn(adminId: string, returnId: string): Promise<{
        success: boolean;
        orderId: string;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus | null;
        alreadyApproved: boolean;
    }>;
    rejectReturn(adminId: string, returnId: string, reason?: string): Promise<{
        success: boolean;
        returnId: string;
        orderId: string;
        alreadyRejected: boolean;
    }>;
    processReturnRefund(adminId: string, returnId: string): Promise<{
        success: boolean;
        returnId: string;
        alreadyRefunded: boolean;
        refundTriggered?: never;
    } | {
        success: boolean;
        returnId: string;
        refundTriggered: boolean;
        alreadyRefunded: boolean;
    }>;
}
export declare const returnService: ReturnService;
export {};
//# sourceMappingURL=return.service.d.ts.map