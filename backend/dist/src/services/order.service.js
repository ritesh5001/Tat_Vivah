import { orderRepository } from '../repositories/order.repository.js';
import { getFromCache, setCache, CACHE_KEYS, } from '../utils/cache.util.js';
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
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 20;
        const startKey = params?.startDate?.toISOString() ?? '_';
        const endKey = params?.endDate?.toISOString() ?? '_';
        const cacheKey = `${CACHE_KEYS.BUYER_ORDERS(userId)}:${page}:${limit}:${startKey}:${endKey}`;
        // Try cache first
        const cached = await getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        const orders = await this.orderRepo.findByUserId(userId, params);
        const response = { orders };
        // Cache the result
        await setCache(cacheKey, response);
        return response;
    }
    /**
     * Get buyer's order detail
     * Uses Redis caching
     */
    async getBuyerOrder(orderId, userId) {
        // Try cache first
        const cached = await getFromCache(CACHE_KEYS.ORDER_DETAIL(orderId));
        if (cached && cached.order.userId === userId) {
            return cached;
        }
        const order = await this.orderRepo.findByIdAndUserId(orderId, userId);
        if (!order) {
            throw ApiError.notFound('Order not found');
        }
        const response = { order };
        // Cache the result
        await setCache(CACHE_KEYS.ORDER_DETAIL(orderId), response);
        return response;
    }
    // =========================================================================
    // SELLER METHODS
    // =========================================================================
    /**
     * List seller's order items
     * No caching (frequently changing data)
     */
    async listSellerOrders(sellerId, params) {
        const orderItems = await this.orderRepo.findBySellerId(sellerId, params);
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