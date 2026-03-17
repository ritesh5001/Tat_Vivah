import { prisma } from '../config/db.js';
import type {
    OrderEntity,
    OrderWithItems,
    OrderWithDetails,
    CreateOrderRequest,
    SellerOrderItem,
    OrderItemWithProduct,
} from '../types/order.types.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function resolvePagination(page?: number, limit?: number): { skip: number; take: number } {
    const pRaw = Number(page ?? 1);
    const lRaw = Number(limit ?? DEFAULT_LIMIT);
    const p = Number.isFinite(pRaw) && pRaw > 0 ? Math.trunc(pRaw) : 1;
    const l = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(lRaw) ? Math.trunc(lRaw) : DEFAULT_LIMIT));
    return { skip: (p - 1) * l, take: l };
}

/**
 * Order Repository
 * Handles database operations for orders
 */
export class OrderRepository {
    /**
     * Create order with items (used within transaction)
     */
    async create(data: CreateOrderRequest): Promise<OrderWithItems> {
        return prisma.order.create({
            data: {
                userId: data.userId,
                totalAmount: data.totalAmount,
                items: {
                    create: data.items.map((item) => ({
                        sellerId: item.sellerId,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        priceSnapshot: item.priceSnapshot,
                        sellerPriceSnapshot: item.sellerPriceSnapshot,
                        adminPriceSnapshot: item.adminPriceSnapshot,
                        platformMargin: item.platformMargin,
                    })),
                },
            },
            include: {
                items: true,
            },
        });
    }

    /**
     * Find order by ID
     */
    async findById(id: string): Promise<OrderEntity | null> {
        return prisma.order.findUnique({
            where: { id },
        });
    }

    /**
     * Find order by ID and user ID (buyer ownership check)
     */
    async findByIdAndUserId(id: string, userId: string): Promise<OrderWithDetails | null> {
        const order = await prisma.order.findFirst({
            where: { id, userId },
            include: {
                items: true,
                movements: true,
            },
        });

        if (!order) {
            return null;
        }

        // Enhance with product/variant details
        const itemsWithDetails = await this.enrichOrderItems(order.items);

        return {
            ...order,
            items: itemsWithDetails,
        };
    }

    /**
     * Find all orders for a user (buyer)
     */
    async findByUserId(
        userId: string,
        params?: { page?: number; limit?: number; startDate?: Date; endDate?: Date }
    ): Promise<OrderWithItems[]> {
        const { skip, take } = resolvePagination(params?.page, params?.limit);
        const createdAtFilter =
            params?.startDate || params?.endDate
                ? {
                    ...(params.startDate ? { gte: params.startDate } : {}),
                    ...(params.endDate ? { lte: params.endDate } : {}),
                }
                : undefined;

        const orders = await prisma.order.findMany({
            where: {
                userId,
                ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
            },
            include: {
                items: true,
                cancellationRequest: {
                    select: {
                        id: true,
                        status: true,
                    },
                },
                shipments: {
                    select: {
                        status: true,
                        created_at: true,
                    },
                    orderBy: { created_at: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });

        return orders.map((order) => {
            const hasShipped = order.shipments.some((shipment) => shipment.status === 'SHIPPED');
            const latestShipmentStatus = order.shipments[0]?.status ?? null;

            return {
                ...order,
                shipmentStatus: hasShipped ? 'SHIPPED' : latestShipmentStatus,
            } as OrderWithItems;
        });
    }

    /**
     * Find order items for a seller
     * Uses batch lookups instead of N+1 queries
     */
    async findBySellerId(
        sellerId: string,
        params?: { page?: number; limit?: number; startDate?: Date; endDate?: Date }
    ): Promise<SellerOrderItem[]> {
        const { skip, take } = resolvePagination(params?.page, params?.limit);
        const createdAtFilter =
            params?.startDate || params?.endDate
                ? {
                    ...(params.startDate ? { gte: params.startDate } : {}),
                    ...(params.endDate ? { lte: params.endDate } : {}),
                }
                : undefined;

        const orderItems = await prisma.orderItem.findMany({
            where: {
                sellerId,
                ...(createdAtFilter ? { order: { createdAt: createdAtFilter } } : {}),
            },
            include: {
                order: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        cancellationRequest: {
                            select: {
                                id: true,
                                status: true,
                                reason: true,
                                createdAt: true,
                            },
                        },
                        shippingName: true,
                        shippingPhone: true,
                        shippingEmail: true,
                        shippingAddressLine1: true,
                        shippingAddressLine2: true,
                        shippingCity: true,
                        shippingPincode: true,
                        shippingNotes: true,
                    },
                },
            },
            orderBy: { order: { createdAt: 'desc' } },
            skip,
            take,
        });

        // Batch lookup instead of N+1
        const productIds = [...new Set(orderItems.map((i) => i.productId))];
        const variantIds = [...new Set(orderItems.map((i) => i.variantId))];

        const [products, variants] = await Promise.all([
            productIds.length
                ? prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, title: true },
                })
                : [],
            variantIds.length
                ? prisma.productVariant.findMany({
                    where: { id: { in: variantIds } },
                    select: { id: true, sku: true },
                })
                : [],
        ]);

        const productMap = new Map(products.map((p) => [p.id, p.title]));
        const variantMap = new Map(variants.map((v) => [v.id, v.sku]));

        return orderItems.map((item) => ({
            ...item,
            productTitle: productMap.get(item.productId),
            variantSku: variantMap.get(item.variantId),
        }));
    }

    /**
     * Find order items for a specific order belonging to seller
     */
    async findSellerOrderById(orderId: string, sellerId: string): Promise<{
        order: { id: string; status: string; createdAt: Date } | null;
        items: OrderItemWithProduct[];
    }> {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                createdAt: true,
                shippingName: true,
                shippingPhone: true,
                shippingEmail: true,
                shippingAddressLine1: true,
                shippingAddressLine2: true,
                shippingCity: true,
                shippingPincode: true,
                shippingNotes: true,
            },
        });

        if (!order) {
            return { order: null, items: [] };
        }

        const items = await prisma.orderItem.findMany({
            where: { orderId, sellerId },
        });

        const itemsWithDetails = await this.enrichOrderItems(items);

        return { order, items: itemsWithDetails };
    }

    /**
     * Helper to enrich order items with product/variant details
     * Uses batch lookups (2 queries total) instead of 2N individual queries.
     */
    private async enrichOrderItems(items: { productId: string; variantId: string;[key: string]: any }[]): Promise<OrderItemWithProduct[]> {
        if (items.length === 0) return [];

        const productIds = [...new Set(items.map((i) => i.productId))];
        const variantIds = [...new Set(items.map((i) => i.variantId))];

        const [products, variants] = await Promise.all([
            prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, title: true },
            }),
            prisma.productVariant.findMany({
                where: { id: { in: variantIds } },
                select: { id: true, sku: true },
            }),
        ]);

        const productMap = new Map(products.map((p) => [p.id, p.title]));
        const variantMap = new Map(variants.map((v) => [v.id, v.sku]));

        return items.map((item) => ({
            ...item,
            productTitle: productMap.get(item.productId),
            variantSku: variantMap.get(item.variantId),
        } as OrderItemWithProduct));
    }
}

// Export singleton instance
export const orderRepository = new OrderRepository();
