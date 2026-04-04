import { OrderRepository, orderRepository } from '../repositories/order.repository.js';
import {
    getFromCache,
    setCache,
    CACHE_KEYS,
} from '../utils/cache.util.js';
import { ApiError } from '../errors/ApiError.js';
import type {
    BuyerOrderListResponse,
    BuyerOrderDetailResponse,
    SellerOrderListResponse,
    SellerOrderDetailResponse,
} from '../types/order.types.js';

/**
 * Order Service
 * Business logic for order viewing (buyer and seller)
 */
export class OrderService {
    constructor(private readonly orderRepo: OrderRepository) { }

    // =========================================================================
    // BUYER METHODS
    // =========================================================================

    /**
     * List buyer's orders
     * Uses Redis caching
     */
    async listBuyerOrders(
        userId: string,
        params?: { page?: number; limit?: number; startDate?: Date; endDate?: Date }
    ): Promise<BuyerOrderListResponse> {
        const page = Math.max(1, Math.trunc(params?.page ?? 1));
        const limit = Math.min(20, Math.max(1, Math.trunc(params?.limit ?? 20)));
        const startKey = params?.startDate?.toISOString() ?? '_';
        const endKey = params?.endDate?.toISOString() ?? '_';
        const cacheKey = `${CACHE_KEYS.BUYER_ORDERS(userId)}:${page}:${limit}:${startKey}:${endKey}`;

        // Try cache first
        const cached = await getFromCache<BuyerOrderListResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const orders = await this.orderRepo.findByUserId(userId, { ...params, page, limit });
        const response: BuyerOrderListResponse = { orders };

        // Cache the result
        await setCache(cacheKey, response);

        return response;
    }

    /**
     * Get buyer's order detail
     * Uses Redis caching
     */
    async getBuyerOrder(orderId: string, userId: string): Promise<BuyerOrderDetailResponse> {
        // Try cache first
        const cached = await getFromCache<BuyerOrderDetailResponse>(
            CACHE_KEYS.ORDER_DETAIL(orderId)
        );
        if (cached && cached.order.userId === userId) {
            return cached;
        }

        const order = await this.orderRepo.findByIdAndUserId(orderId, userId);
        if (!order) {
            throw ApiError.notFound('Order not found');
        }

        const response: BuyerOrderDetailResponse = { order };

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
    async listSellerOrders(
        sellerId: string,
        params?: { page?: number; limit?: number; startDate?: Date; endDate?: Date }
    ): Promise<SellerOrderListResponse> {
        const page = Math.max(1, Math.trunc(params?.page ?? 1));
        const limit = Math.min(20, Math.max(1, Math.trunc(params?.limit ?? 20)));
        const orderItems = await this.orderRepo.findBySellerId(sellerId, { ...params, page, limit });
        return { orderItems };
    }

    /**
     * Get seller's view of an order (only their items)
     */
    async getSellerOrder(
        orderId: string,
        sellerId: string
    ): Promise<SellerOrderDetailResponse> {
        const result = await this.orderRepo.findSellerOrderById(orderId, sellerId);

        if (!result.order) {
            throw ApiError.notFound('Order not found');
        }

        if (result.items.length === 0) {
            throw ApiError.forbidden('No items in this order belong to you');
        }

        return {
            orderId: result.order.id,
            status: result.order.status as any,
            createdAt: result.order.createdAt,
            items: result.items,
        };
    }
}

// Export singleton instance
export const orderService = new OrderService(orderRepository);
