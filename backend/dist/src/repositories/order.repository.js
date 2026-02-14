import { prisma } from '../config/db.js';
/**
 * Order Repository
 * Handles database operations for orders
 */
export class OrderRepository {
    /**
     * Create order with items (used within transaction)
     */
    async create(data) {
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
    async findById(id) {
        return prisma.order.findUnique({
            where: { id },
        });
    }
    /**
     * Find order by ID and user ID (buyer ownership check)
     */
    async findByIdAndUserId(id, userId) {
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
    async findByUserId(userId) {
        return prisma.order.findMany({
            where: { userId },
            include: {
                items: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Find order items for a seller
     */
    async findBySellerId(sellerId) {
        const orderItems = await prisma.orderItem.findMany({
            where: { sellerId },
            include: {
                order: {
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
                        shippingNotes: true,
                    },
                },
            },
            orderBy: { order: { createdAt: 'desc' } },
        });
        // Enhance with product/variant details
        return Promise.all(orderItems.map(async (item) => {
            const [product, variant] = await Promise.all([
                prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { title: true },
                }),
                prisma.productVariant.findUnique({
                    where: { id: item.variantId },
                    select: { sku: true },
                }),
            ]);
            return {
                ...item,
                productTitle: product?.title,
                variantSku: variant?.sku,
            };
        }));
    }
    /**
     * Find order items for a specific order belonging to seller
     */
    async findSellerOrderById(orderId, sellerId) {
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
     */
    async enrichOrderItems(items) {
        return Promise.all(items.map(async (item) => {
            const [product, variant] = await Promise.all([
                prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { title: true },
                }),
                prisma.productVariant.findUnique({
                    where: { id: item.variantId },
                    select: { sku: true },
                }),
            ]);
            return {
                ...item,
                productTitle: product?.title,
                variantSku: variant?.sku,
            };
        }));
    }
}
// Export singleton instance
export const orderRepository = new OrderRepository();
//# sourceMappingURL=order.repository.js.map