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
        const existing = await prisma.cart.findUnique({
            where: { userId },
        });
        if (existing) {
            return existing;
        }
        return prisma.cart.create({
            data: { userId },
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
     */
    async getCartWithDetails(userId) {
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!cart) {
            return null;
        }
        // Fetch product and variant details for each item
        const itemsWithDetails = await Promise.all(cart.items.map(async (item) => {
            const [product, variant] = await Promise.all([
                prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, title: true, sellerId: true, adminListingPrice: true, sellerPrice: true },
                }),
                prisma.productVariant.findUnique({
                    where: { id: item.variantId },
                    select: {
                        id: true,
                        sku: true,
                        price: true,
                        inventory: { select: { stock: true } },
                    },
                }),
            ]);
            return {
                ...item,
                product: product ?? undefined,
                variant: variant
                    ? {
                        ...variant,
                        price: product?.adminListingPrice != null
                            ? Number(product.adminListingPrice)
                            : variant.price,
                    }
                    : undefined,
            };
        }));
        return {
            ...cart,
            items: itemsWithDetails,
        };
    }
}
// Export singleton instance
export const cartRepository = new CartRepository();
//# sourceMappingURL=cart.repository.js.map