/**
 * Admin Service
 * Business logic for admin panel operations
 */
import { AdminRepository, AdminSeller, AdminProduct, AdminOrder, AdminPayment, AdminSettlement, AdminPricingOverviewItem, AdminProfitAnalytics } from '../repositories/admin.repository.js';
import { AuditService } from './audit.service.js';
/**
 * Admin Service Class
 * Handles all admin panel business logic with audit logging
 */
export declare class AdminService {
    private readonly adminRepo;
    private readonly auditSvc;
    constructor(adminRepo: AdminRepository, auditSvc: AuditService);
    /**
     * Lightweight counts for the admin dashboard.
     * Uses COUNT queries instead of fetching entire collections.
     */
    getStats(): Promise<{
        stats: {
            sellers: number;
            products: number;
            orders: number;
            payments: number;
        };
        recentSellers: AdminSeller[];
        recentProducts: AdminProduct[];
    }>;
    /**
     * List all sellers
     */
    listSellers(): Promise<{
        sellers: AdminSeller[];
    }>;
    /**
     * Approve a pending seller
     */
    approveSeller(sellerId: string, actorId: string): Promise<{
        message: string;
        seller: AdminSeller;
    }>;
    /**
     * Suspend a seller
     */
    suspendSeller(sellerId: string, actorId: string): Promise<{
        message: string;
        seller: AdminSeller;
    }>;
    /**
     * List products pending moderation
     */
    listPendingProducts(): Promise<{
        products: AdminProduct[];
    }>;
    /**
     * List all products (admin table view)
     */
    listAllProducts(): Promise<{
        products: AdminProduct[];
    }>;
    /**
     * Approve a product
     */
    approveProduct(productId: string, actorId: string): Promise<{
        message: string;
        product: AdminProduct;
    }>;
    /**
     * Reject a product
     */
    rejectProduct(productId: string, reason: string, actorId: string): Promise<{
        message: string;
        product: AdminProduct;
    }>;
    /**
     * Delete product by admin (soft delete)
     */
    deleteProduct(productId: string, actorId: string, reason?: string): Promise<{
        message: string;
        product: AdminProduct;
    }>;
    setProductPrice(productId: string, adminListingPrice: number, actorId: string): Promise<{
        sellerPrice: number;
        adminListingPrice: number;
        margin: number;
        marginPercentage: number;
    }>;
    pricingOverview(): Promise<{
        products: AdminPricingOverviewItem[];
    }>;
    profitAnalytics(): Promise<AdminProfitAnalytics>;
    /**
     * List all orders (with caching)
     */
    listOrders(): Promise<{
        orders: AdminOrder[];
    }>;
    /**
     * Cancel an order (ADMIN can cancel non-delivered orders)
     */
    cancelOrder(orderId: string, actorId: string): Promise<{
        message: string;
        order: AdminOrder;
    }>;
    /**
     * Force confirm an order (SUPER_ADMIN only - bypasses payment)
     */
    forceConfirmOrder(orderId: string, actorId: string): Promise<{
        message: string;
        order: AdminOrder;
    }>;
    /**
     * List all payments (with caching)
     */
    listPayments(): Promise<{
        payments: AdminPayment[];
    }>;
    /**
     * List all settlements
     */
    listSettlements(): Promise<{
        settlements: AdminSettlement[];
    }>;
}
export declare const adminService: AdminService;
//# sourceMappingURL=admin.service.d.ts.map