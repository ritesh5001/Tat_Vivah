import { OrderRepository, orderRepository } from '../repositories/order.repository.js';
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
        const orders = await this.orderRepo.findByUserId(userId, { ...params, page, limit });
        return { orders };
    }

    /**
     * Get buyer's order detail
     * Uses Redis caching
     */
    async getBuyerOrder(orderId: string, userId: string): Promise<BuyerOrderDetailResponse> {
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
