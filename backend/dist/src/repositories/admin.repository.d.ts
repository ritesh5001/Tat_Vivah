/**
 * Admin Repository
 * Database operations for admin panel
 */
export type ProductModerationStatusType = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserStatusType = 'PENDING' | 'ACTIVE' | 'SUSPENDED';
export type OrderStatusType = 'PLACED' | 'CONFIRMED' | 'CANCELLED' | 'SHIPPED' | 'DELIVERED';
export interface AdminSeller {
    id: string;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    createdAt: Date;
}
export interface AdminProduct {
    id: string;
    title: string;
    description?: string | null;
    images?: string[];
    sellerId: string;
    sellerName?: string | null;
    sellerPhone?: string | null;
    sellerEmail: string | null;
    categoryId: string;
    categoryName: string | null;
    sellerPrice?: number;
    adminListingPrice?: number | null;
    priceApprovedAt?: Date | null;
    priceApprovedById?: string | null;
    status: ProductModerationStatusType;
    rejectionReason?: string | null;
    approvedAt?: Date | null;
    approvedById?: string | null;
    variants?: Array<{
        id: string;
        sku: string;
        price: number;
        compareAtPrice: number | null;
        stock: number;
    }>;
    isPublished: boolean;
    deletedByAdmin: boolean;
    deletedByAdminAt: Date | null;
    deletedByAdminReason: string | null;
    createdAt: Date;
    moderation: {
        status: string;
        reason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    } | null;
}
export interface AdminOrder {
    id: string;
    userId: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
    items: {
        id: string;
        sellerId: string;
        productId: string;
        variantId: string;
        quantity: number;
        priceSnapshot: number;
        sellerPriceSnapshot?: number;
        adminPriceSnapshot?: number;
        platformMargin?: number;
    }[];
}
export interface AdminPricingOverviewItem {
    productId: string;
    title: string;
    sellerId: string;
    sellerName: string | null;
    sellerEmail: string | null;
    sellerPrice: number;
    adminListingPrice: number | null;
    margin: number | null;
    marginPercentage: number | null;
    status: ProductModerationStatusType;
    image: string | null;
    updatedAt: Date;
}
export interface AdminProfitAnalytics {
    totalPlatformRevenue: number;
    totalSellerPayout: number;
    totalMarginEarned: number;
    profitPerProduct: Array<{
        productId: string;
        title: string;
        margin: number;
        soldUnits: number;
    }>;
    profitPerSeller: Array<{
        sellerId: string;
        sellerEmail: string | null;
        sellerName: string | null;
        margin: number;
        soldUnits: number;
    }>;
}
export interface AdminPayment {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    providerPaymentId: string | null;
    createdAt: Date;
}
export interface AdminSettlement {
    id: string;
    sellerId: string;
    orderItemId: string;
    amount: number;
    status: string;
    createdAt: Date;
}
/**
 * Admin Repository Class
 * Handles all admin-related database queries
 */
export declare class AdminRepository {
    /**
     * Find all sellers
     */
    findAllSellers(): Promise<AdminSeller[]>;
    /**
     * Find seller by ID
     */
    findSellerById(id: string): Promise<AdminSeller | null>;
    /**
     * Update seller status
     */
    updateSellerStatus(id: string, status: UserStatusType): Promise<AdminSeller>;
    /**
     * Find all products pending moderation
     */
    findPendingProducts(): Promise<AdminProduct[]>;
    /**
     * Find product by ID with moderation info
     */
    findProductById(id: string): Promise<AdminProduct | null>;
    /**
     * List all products for admin view
     */
    findAllProducts(): Promise<AdminProduct[]>;
    /**
     * Soft-delete a product by admin
     */
    markProductDeletedByAdmin(id: string, reason?: string): Promise<AdminProduct>;
    /**
     * Update product moderation status
     */
    updateProductModeration(productId: string, status: ProductModerationStatusType, reviewedBy: string, reason?: string): Promise<void>;
    /**
     * Update product publish status
     */
    updateProductPublishStatus(id: string, isPublished: boolean): Promise<AdminProduct>;
    applyProductApprovalDecision(productId: string, actorId: string, decision: 'APPROVED' | 'REJECTED', reason?: string): Promise<AdminProduct>;
    setProductListingPrice(productId: string, adminListingPrice: number, actorId: string): Promise<AdminProduct>;
    findProductPricingOverview(): Promise<AdminPricingOverviewItem[]>;
    getProfitAnalytics(): Promise<AdminProfitAnalytics>;
    /**
     * Find all orders
     */
    findAllOrders(): Promise<AdminOrder[]>;
    /**
     * Find order by ID
     */
    findOrderById(id: string): Promise<AdminOrder | null>;
    /**
     * Update order status
     */
    updateOrderStatus(id: string, status: OrderStatusType): Promise<AdminOrder>;
    /**
     * Find all payments
     */
    findAllPayments(): Promise<AdminPayment[]>;
    /**
     * Find all settlements
     */
    findAllSettlements(): Promise<AdminSettlement[]>;
}
export declare const adminRepository: AdminRepository;
//# sourceMappingURL=admin.repository.d.ts.map