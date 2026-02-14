/**
 * Admin Types
 * DTOs for admin panel operations
 */
import type { UserStatus, Role, OrderStatus, PaymentStatus, SettlementStatus, ProductModerationStatus, AuditEntity } from '@prisma/client';
export interface AdminSellerEntity {
    id: string;
    email: string | null;
    phone: string | null;
    role: Role;
    status: UserStatus;
    createdAt: Date;
}
export interface AdminSellerListResponse {
    sellers: AdminSellerEntity[];
}
export interface AdminSellerActionResponse {
    message: string;
    seller: AdminSellerEntity;
}
export interface AdminProductEntity {
    id: string;
    title: string;
    sellerId: string;
    categoryId: string;
    isPublished: boolean;
    createdAt: Date;
    moderation: {
        status: ProductModerationStatus;
        reason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    } | null;
}
export interface AdminProductListResponse {
    products: AdminProductEntity[];
}
export interface AdminProductActionResponse {
    message: string;
    product: AdminProductEntity;
}
export interface ProductModerationInput {
    reason?: string;
}
export interface AdminOrderEntity {
    id: string;
    userId: string;
    status: OrderStatus;
    totalAmount: number;
    createdAt: Date;
    items: {
        id: string;
        sellerId: string;
        productId: string;
        variantId: string;
        quantity: number;
        priceSnapshot: number;
    }[];
}
export interface AdminOrderListResponse {
    orders: AdminOrderEntity[];
}
export interface AdminOrderActionResponse {
    message: string;
    order: AdminOrderEntity;
}
export interface AdminPaymentEntity {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    provider: string;
    providerPaymentId: string | null;
    createdAt: Date;
}
export interface AdminPaymentListResponse {
    payments: AdminPaymentEntity[];
}
export interface AdminSettlementEntity {
    id: string;
    sellerId: string;
    orderItemId: string;
    amount: number;
    status: SettlementStatus;
    createdAt: Date;
}
export interface AdminSettlementListResponse {
    settlements: AdminSettlementEntity[];
}
export interface AuditLogEntity {
    id: string;
    actorId: string;
    action: string;
    entityType: AuditEntity;
    entityId: string;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
}
export interface AuditLogListResponse {
    auditLogs: AuditLogEntity[];
}
export interface AuditLogFilters {
    entityType?: AuditEntity;
    entityId?: string;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
}
export interface CreateAuditLogInput {
    actorId: string;
    action: string;
    entityType: AuditEntity;
    entityId: string;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=admin.types.d.ts.map