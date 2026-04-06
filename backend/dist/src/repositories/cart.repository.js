import { prisma } from '../config/db.js';
/**
 * Cart Repository
 * Handles database operations for shopping carts
 */
export class CartRepository {
    /**
     * Find cart by user ID with items (basic - no product/variant details)
     */
    async findByUserId(userId) {
        return prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }
    /**
     * Find or create cart for user
     */
    async findOrCreateByUserId(userId) {
        return prisma.cart.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });
    }
    /**
     * Add item to cart (upsert - updates quantity if exists)
     */
    async addItem(cartId, data) {
        // Use upsert to handle unique constraint
        return prisma.cartItem.upsert({
            where: {
                cartId_variantId: {
                    cartId,
                    variantId: data.variantId,
                },
            },
            create: {
                cartId,
                productId: data.productId,
                variantId: data.variantId,
                quantity: data.quantity,
                priceSnapshot: data.priceSnapshot,
            },
            update: {
                quantity: data.quantity,
                priceSnapshot: data.priceSnapshot,
            },
        });
    }
    /**
     * Find cart item by ID
     */
    async findItemById(itemId) {
        return prisma.cartItem.findUnique({
            where: { id: itemId },
        });
    }
    /**
     * Find cart item by ID with cart (for ownership check)
     */
    async findItemByIdWithCart(itemId) {
        return prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });
    }
    /**
     * Update item quantity
     */
    async updateItemQuantity(itemId, quantity, priceSnapshot) {
        return prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity, priceSnapshot },
        });
    }
    /**
     * Remove item from cart
     */
    async removeItem(itemId) {
        await prisma.cartItem.delete({
            where: { id: itemId },
        });
    }
    /**
     * Clear all items from cart
     */
    async clearCart(cartId) {
        await prisma.cartItem.deleteMany({
            where: { cartId },
        });
    }
    /**
     * Get cart items with product and variant details
     * Uses batch lookups (2 queries) instead of 2N individual queries.
     */
    async getCartWithDetails(userId) {
        const cart = await prisma.cart.upsert({
            where: { userId },
            update: {},
            create: { userId },
            include: {
                items: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (cart.items.length === 0) {
            return { ...cart, items: [] };
        }
        // Batch lookup — 2 queries total instead of 2N
        const productIds = [...new Set(cart.items.map((item) => item.productId))];
        const variantIds = [...new Set(cart.items.map((item) => item.variantId))];
        const [products, variants] = await Promise.all([
            prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, title: true, sellerId: true, adminListingPrice: true, sellerPrice: true },
            }),
            prisma.productVariant.findMany({
                where: { id: { in: variantIds } },
                select: {
                    id: true,
                    sku: true,
                    price: true,
                    inventory: { select: { stock: true } },
                },
            }),
        ]);
        const productMap = new Map(products.map((p) => [p.id, p]));
        const variantMap = new Map(variants.map((v) => [v.id, v]));
        const itemsWithDetails = cart.items.map((item) => {
            const product = productMap.get(item.productId);
            const variant = variantMap.get(item.variantId);
            return {
                ...item,
                product: product
                    ? {
                        ...product,
                        sellerPrice: Number(product.sellerPrice),
                        adminListingPrice: product.adminListingPrice == null
                            ? null
                            : Number(product.adminListingPrice),
                    }
                    : undefined,
                variant: variant
                    ? {
                        ...variant,
                        price: product?.adminListingPrice != null
                            ? Number(product.adminListingPrice)
                            : variant.price,
                    }
                    : undefined,
            };
        });
        return {
            ...cart,
            items: itemsWithDetails,
        };
    }
}
// Export singleton instance
export const cartRepository = new CartRepository();
//# sourceMappingURL=cart.repository.js.map