/**
 * Admin Service
 * Business logic for admin panel operations
 */

import {
    AdminRepository,
    adminRepository,
    AdminSeller,
    AdminProduct,
    AdminOrder,
    AdminPayment,
    AdminSettlement,
    AdminPricingOverviewItem,
    AdminProfitAnalytics,
} from '../repositories/admin.repository.js';
import { AuditService, auditService } from './audit.service.js';
import { ApiError } from '../errors/ApiError.js';
import {
    getFromCache,
    setCache,
    CACHE_KEYS,
    invalidateCache,
    invalidateProductCaches,
} from '../utils/cache.util.js';
import { notificationService } from '../notifications/notification.service.js';
import { bestsellerService } from './bestseller.service.js';
import { calculateMargin } from '../utils/pricing.util.js';

/**
 * Admin Service Class
 * Handles all admin panel business logic with audit logging
 */
export class AdminService {
    constructor(
        private readonly adminRepo: AdminRepository,
        private readonly auditSvc: AuditService
    ) { }

    // =========================================================================
    // SELLER MANAGEMENT
    // =========================================================================

    /**
     * List all sellers
     */
    async listSellers(): Promise<{ sellers: AdminSeller[] }> {
        const sellers = await this.adminRepo.findAllSellers();
        return { sellers };
    }

    /**
     * Approve a pending seller
     */
    async approveSeller(sellerId: string, actorId: string): Promise<{ message: string; seller: AdminSeller }> {
        // Find seller
        const seller = await this.adminRepo.findSellerById(sellerId);
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        // Check if seller is pending
        if (seller.status !== 'PENDING') {
            throw ApiError.badRequest('Seller is not pending approval');
        }

        // Update status to ACTIVE
        const updatedSeller = await this.adminRepo.updateSellerStatus(sellerId, 'ACTIVE');

        await notificationService.notifySellerApproved(updatedSeller.id, updatedSeller.email);

        // Log audit action
        await this.auditSvc.logAction(actorId, 'SELLER_APPROVED', 'USER', sellerId, {
            previousStatus: seller.status,
            newStatus: 'ACTIVE',
        });

        return {
            message: 'Seller approved successfully',
            seller: updatedSeller,
        };
    }

    /**
     * Suspend a seller
     */
    async suspendSeller(sellerId: string, actorId: string): Promise<{ message: string; seller: AdminSeller }> {
        // Find seller
        const seller = await this.adminRepo.findSellerById(sellerId);
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        // Check if seller is active
        if (seller.status === 'SUSPENDED') {
            throw ApiError.badRequest('Seller is already suspended');
        }

        // Update status to SUSPENDED
        const updatedSeller = await this.adminRepo.updateSellerStatus(sellerId, 'SUSPENDED');

        // Log audit action
        await this.auditSvc.logAction(actorId, 'SELLER_SUSPENDED', 'USER', sellerId, {
            previousStatus: seller.status,
            newStatus: 'SUSPENDED',
        });

        return {
            message: 'Seller suspended successfully',
            seller: updatedSeller,
        };
    }

    // =========================================================================
    // PRODUCT MODERATION
    // =========================================================================

    /**
     * List products pending moderation
     */
    async listPendingProducts(): Promise<{ products: AdminProduct[] }> {
        const products = await this.adminRepo.findPendingProducts();
        return { products };
    }

    /**
     * List all products (admin table view)
     */
    async listAllProducts(): Promise<{ products: AdminProduct[] }> {
        const products = await this.adminRepo.findAllProducts();
        return { products };
    }

    /**
     * Approve a product
     */
    async approveProduct(productId: string, actorId: string): Promise<{ message: string; product: AdminProduct }> {
        // Find product
        const product = await this.adminRepo.findProductById(productId);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        if (product.deletedByAdmin) {
            throw ApiError.badRequest('Deleted products cannot be approved');
        }

        if (product.status === 'APPROVED') {
            throw ApiError.badRequest('Product is already approved');
        }

        // Update moderation status
        await this.adminRepo.updateProductModeration(productId, 'APPROVED', actorId);
        const updatedProduct = await this.adminRepo.applyProductApprovalDecision(
            productId,
            actorId,
            'APPROVED'
        );

        await notificationService.notifySellerProductApproved(
            product.sellerId,
            product.title,
            product.sellerEmail
        );

        await invalidateProductCaches(productId);

        // Log audit action
        await this.auditSvc.logAction(actorId, 'PRODUCT_APPROVED', 'PRODUCT', productId, {
            productTitle: product.title,
        });

        return {
            message: 'Product approved',
            product: updatedProduct,
        };
    }

    /**
     * Reject a product
     */
    async rejectProduct(
        productId: string,
        reason: string,
        actorId: string
    ): Promise<{ message: string; product: AdminProduct }> {
        // Find product
        const product = await this.adminRepo.findProductById(productId);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        if (product.deletedByAdmin) {
            throw ApiError.badRequest('Deleted products cannot be moderated');
        }

        if (!reason.trim()) {
            throw ApiError.badRequest('Rejection reason is required');
        }

        // Update moderation status
        await this.adminRepo.updateProductModeration(productId, 'REJECTED', actorId, reason.trim());
        const updatedProduct = await this.adminRepo.applyProductApprovalDecision(
            productId,
            actorId,
            'REJECTED',
            reason.trim()
        );

        await notificationService.notifySellerProductRejected(
            product.sellerId,
            product.title,
            reason.trim(),
            product.sellerEmail
        );

        await invalidateProductCaches(productId);

        // Log audit action
        await this.auditSvc.logAction(actorId, 'PRODUCT_REJECTED', 'PRODUCT', productId, {
            productTitle: product.title,
            reason,
        });

        return {
            message: 'Product rejected',
            product: updatedProduct,
        };
    }

    /**
     * Delete product by admin (soft delete)
     */
    async deleteProduct(
        productId: string,
        actorId: string,
        reason?: string
    ): Promise<{ message: string; product: AdminProduct }> {
        const product = await this.adminRepo.findProductById(productId);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        const deleted = await this.adminRepo.markProductDeletedByAdmin(
            productId,
            reason
        );

        await invalidateProductCaches(productId);
        await bestsellerService.removeByProductId(productId);

        await this.auditSvc.logAction(actorId, 'PRODUCT_DELETED', 'PRODUCT', productId, {
            productTitle: product.title,
            reason: reason ?? 'Deleted by admin',
        });

        return {
            message: 'Product deleted by admin',
            product: deleted,
        };
    }

    async setProductPrice(
        productId: string,
        adminListingPrice: number,
        actorId: string
    ): Promise<{
        sellerPrice: number;
        adminListingPrice: number;
        margin: number;
        marginPercentage: number;
    }> {
        const product = await this.adminRepo.findProductById(productId);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        if (product.deletedByAdmin) {
            throw ApiError.badRequest('Deleted products cannot be priced');
        }

        const sellerPrice = Number(product.sellerPrice ?? 0);
        if (adminListingPrice < sellerPrice) {
            throw ApiError.badRequest('Admin listing price must be greater than or equal to seller price');
        }

        if (product.status !== 'APPROVED') {
            await this.adminRepo.updateProductModeration(productId, 'APPROVED', actorId);
            await this.adminRepo.applyProductApprovalDecision(productId, actorId, 'APPROVED');
        }

        await this.adminRepo.setProductListingPrice(productId, adminListingPrice, actorId);

        const { margin, percentage } = calculateMargin(sellerPrice, adminListingPrice);

        await invalidateProductCaches(productId);

        await this.auditSvc.logAction(actorId, 'PRODUCT_PRICE_SET', 'PRODUCT', productId, {
            productTitle: product.title,
            sellerPrice,
            adminListingPrice,
            margin,
            marginPercentage: percentage,
        });

        return {
            sellerPrice,
            adminListingPrice,
            margin,
            marginPercentage: percentage,
        };
    }

    async pricingOverview(): Promise<{ products: AdminPricingOverviewItem[] }> {
        const products = await this.adminRepo.findProductPricingOverview();
        return { products };
    }

    async profitAnalytics(): Promise<AdminProfitAnalytics> {
        return this.adminRepo.getProfitAnalytics();
    }

    // =========================================================================
    // ORDER MANAGEMENT
    // =========================================================================

    /**
     * List all orders (with caching)
     */
    async listOrders(): Promise<{ orders: AdminOrder[] }> {
        // Try cache first
        const cached = await getFromCache<{ orders: AdminOrder[] }>(CACHE_KEYS.ADMIN_ORDERS);
        if (cached) {
            return cached;
        }

        const orders = await this.adminRepo.findAllOrders();
        const response = { orders };

        // Cache the result
        await setCache(CACHE_KEYS.ADMIN_ORDERS, response);

        return response;
    }

    /**
     * Cancel an order (ADMIN can cancel non-delivered orders)
     */
    async cancelOrder(orderId: string, actorId: string): Promise<{ message: string; order: AdminOrder }> {
        // Find order
        const order = await this.adminRepo.findOrderById(orderId);
        if (!order) {
            throw ApiError.notFound('Order not found');
        }

        // Check if order can be cancelled
        if (order.status === 'DELIVERED') {
            throw ApiError.badRequest('Cannot cancel a delivered order');
        }

        if (order.status === 'CANCELLED') {
            throw ApiError.badRequest('Order is already cancelled');
        }

        // Update order status
        const updatedOrder = await this.adminRepo.updateOrderStatus(orderId, 'CANCELLED');

        // Invalidate cache
        await invalidateCache(CACHE_KEYS.ADMIN_ORDERS);

        // Log audit action
        await this.auditSvc.logAction(actorId, 'ORDER_CANCELLED', 'ORDER', orderId, {
            previousStatus: order.status,
            newStatus: 'CANCELLED',
        });

        return {
            message: 'Order cancelled successfully',
            order: updatedOrder,
        };
    }

    /**
     * Force confirm an order (SUPER_ADMIN only - bypasses payment)
     */
    async forceConfirmOrder(orderId: string, actorId: string): Promise<{ message: string; order: AdminOrder }> {
        // Find order
        const order = await this.adminRepo.findOrderById(orderId);
        if (!order) {
            throw ApiError.notFound('Order not found');
        }

        // Check if order can be confirmed
        if (order.status === 'CONFIRMED') {
            throw ApiError.badRequest('Order is already confirmed');
        }

        if (order.status === 'CANCELLED') {
            throw ApiError.badRequest('Cannot confirm a cancelled order');
        }

        if (order.status === 'DELIVERED') {
            throw ApiError.badRequest('Order is already delivered');
        }

        // Update order status (bypasses payment check)
        const updatedOrder = await this.adminRepo.updateOrderStatus(orderId, 'CONFIRMED');

        // Invalidate cache
        await invalidateCache(CACHE_KEYS.ADMIN_ORDERS);

        // Log audit action
        await this.auditSvc.logAction(actorId, 'ORDER_FORCE_CONFIRMED', 'ORDER', orderId, {
            previousStatus: order.status,
            newStatus: 'CONFIRMED',
            bypassedPayment: true,
        });

        return {
            message: 'Order force-confirmed (payment bypassed)',
            order: updatedOrder,
        };
    }

    // =========================================================================
    // PAYMENTS & SETTLEMENTS (READ-ONLY)
    // =========================================================================

    /**
     * List all payments (with caching)
     */
    async listPayments(): Promise<{ payments: AdminPayment[] }> {
        // Try cache first
        const cached = await getFromCache<{ payments: AdminPayment[] }>(CACHE_KEYS.ADMIN_PAYMENTS);
        if (cached) {
            return cached;
        }

        const payments = await this.adminRepo.findAllPayments();
        const response = { payments };

        // Cache the result
        await setCache(CACHE_KEYS.ADMIN_PAYMENTS, response);

        return response;
    }

    /**
     * List all settlements
     */
    async listSettlements(): Promise<{ settlements: AdminSettlement[] }> {
        const settlements = await this.adminRepo.findAllSettlements();
        return { settlements };
    }
}

// Export singleton instance
export const adminService = new AdminService(adminRepository, auditService);
