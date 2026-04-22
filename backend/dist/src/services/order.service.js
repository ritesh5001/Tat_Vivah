import { orderRepository } from '../repositories/order.repository.js';
import { ApiError } from '../errors/ApiError.js';
/**
 * Order Service
 * Business logic for order viewing (buyer and seller)
 */
export class OrderService {
    orderRepo;
    constructor(orderRepo) {
        this.orderRepo = orderRepo;
    }
    // =========================================================================
    // BUYER METHODS
    // =========================================================================
    /**
     * List buyer's orders
     * Uses Redis caching
     */
    async listBuyerOrders(userId, params) {
        const page = Math.max(1, Math.trunc(params?.page ?? 1));
        const limit = Math.min(20, Math.max(1, Math.trunc(params?.limit ?? 20)));
        const orders = await this.orderRepo.findByUserId(userId, { ...params, page, limit });
        return { orders };
    }
    /**
     * Get buyer's order detail
     * Uses Redis caching
     */
    async getBuyerOrder(orderId, userId) {
        const order = await this.orderRepo.findByIdAndUserId(orderId, userId);
        if (!order) {
            throw ApiError.notFound('Order not found');
        }
        return { order };
    }
    // =========================================================================
    // SELLER METHODS
    // =========================================================================
    /**
     * List seller's order items
     * No caching (frequently changing data)
     */
    async listSellerOrders(sellerId, params) {
        const page = Math.max(1, Math.trunc(params?.page ?? 1));
        const limit = Math.min(20, Math.max(1, Math.trunc(params?.limit ?? 20)));
        const orderItems = await this.orderRepo.findBySellerId(sellerId, { ...params, page, limit });
        return { orderItems };
    }
    /**
     * Get seller's view of an order (only their items)
     */
    async getSellerOrder(orderId, sellerId) {
        const result = await this.orderRepo.findSellerOrderById(orderId, sellerId);
        if (!result.order) {
            throw ApiError.notFound('Order not found');
        }
        if (result.items.length === 0) {
            throw ApiError.forbidden('No items in this order belong to you');
        }
        return {
            orderId: result.order.id,
            status: result.order.status,
            createdAt: result.order.createdAt,
            items: result.items,
        };
    }
}
// Export singleton instance
export const orderService = new OrderService(orderRepository);
//# sourceMappingURL=order.service.js.map