import { CartRepository, cartRepository } from '../repositories/cart.repository.js';
import { VariantRepository, variantRepository } from '../repositories/variant.repository.js';
import {
    invalidateCache,
    CACHE_KEYS,
} from '../utils/cache.util.js';
import { ApiError } from '../errors/ApiError.js';
import type {
    CartResponse,
    CartItemResponse,
    CartItemDeleteResponse,
    AddCartItemRequest,
} from '../types/cart.types.js';

/**
 * Cart Service
 * Business logic for shopping cart operations
 */
export class CartService {
    constructor(
        private readonly cartRepo: CartRepository,
        private readonly variantRepo: VariantRepository
    ) { }

    /**
     * Get user's cart with items
     * Uses Redis caching
     */
    async getCart(userId: string): Promise<CartResponse> {
        // Get cart with details
        const cart = await this.cartRepo.getCartWithDetails(userId);
        if (!cart) {
            throw ApiError.internal('Failed to create cart');
        }

        return { cart };
    }

    /**
     * Add item to cart
     * Validates stock availability and snapshots price
     */
    async addItem(userId: string, data: AddCartItemRequest): Promise<CartItemResponse> {
        // 1. Validate variant exists and get price
        const variant = await this.variantRepo.findByIdWithProduct(data.variantId);
        if (!variant) {
            throw ApiError.notFound('Variant not found');
        }

        // 2. Validate product ID matches
        if (variant.productId !== data.productId) {
            throw ApiError.badRequest('Variant does not belong to specified product');
        }

        if (variant.product.deletedByAdmin || variant.product.status !== 'APPROVED') {
            throw ApiError.badRequest('This product is not available for purchase');
        }

        const adminListingPrice = variant.product.adminListingPrice;
        if (adminListingPrice === null || adminListingPrice === undefined) {
            throw ApiError.badRequest('This product is pending price approval');
        }

        // 3. Check stock availability
        const availableStock = variant.inventory?.stock ?? 0;

        if (data.quantity > availableStock) {
            throw ApiError.badRequest(
                `Insufficient stock. Available: ${availableStock}, Requested: ${data.quantity}`
            );
        }

        // 4. Get or create cart
        const cart = await this.cartRepo.findOrCreateByUserId(userId);

        // 5. Add/update item with price snapshot
        const item = await this.cartRepo.addItem(cart.id, {
            ...data,
            priceSnapshot: Number(adminListingPrice),
        });

        // 6. Invalidate cache
        await invalidateCache(CACHE_KEYS.CART(userId));

        return {
            message: 'Item added to cart',
            item,
        };
    }

    /**
     * Update cart item quantity
     * Validates stock availability
     */
    async updateItem(
        userId: string,
        itemId: string,
        quantity: number
    ): Promise<CartItemResponse> {
        // 1. Find item with cart for ownership check
        const itemWithCart = await this.cartRepo.findItemByIdWithCart(itemId);
        if (!itemWithCart) {
            throw ApiError.notFound('Cart item not found');
        }

        // 2. Verify ownership
        if (itemWithCart.cart.userId !== userId) {
            throw ApiError.forbidden('You do not have permission to update this item');
        }

        // 3. Check stock availability + pricing in a single variant lookup
        const variantWithProduct = await this.variantRepo.findByIdWithProduct(itemWithCart.variantId);
        if (!variantWithProduct) {
            throw ApiError.notFound('Variant not found');
        }
        const availableStock = variantWithProduct.inventory?.stock ?? 0;

        if (quantity > availableStock) {
            throw ApiError.badRequest(
                `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`
            );
        }

        // 4. Get current price for snapshot update
        const currentPrice =
            variantWithProduct?.product?.adminListingPrice != null
                ? Number(variantWithProduct.product.adminListingPrice)
            : variantWithProduct.price ?? itemWithCart.priceSnapshot;

        // 5. Update quantity
        const item = await this.cartRepo.updateItemQuantity(itemId, quantity, currentPrice);

        // 6. Invalidate cache
        await invalidateCache(CACHE_KEYS.CART(userId));

        return {
            message: 'Cart item updated',
            item,
        };
    }

    /**
     * Remove item from cart
     */
    async removeItem(userId: string, itemId: string): Promise<CartItemDeleteResponse> {
        // 1. Find item with cart for ownership check
        const itemWithCart = await this.cartRepo.findItemByIdWithCart(itemId);
        if (!itemWithCart) {
            throw ApiError.notFound('Cart item not found');
        }

        // 2. Verify ownership
        if (itemWithCart.cart.userId !== userId) {
            throw ApiError.forbidden('You do not have permission to remove this item');
        }

        // 3. Remove item
        await this.cartRepo.removeItem(itemId);

        // 4. Invalidate cache
        await invalidateCache(CACHE_KEYS.CART(userId));

        return {
            message: 'Item removed from cart',
        };
    }
}

// Export singleton instance with default repositories
export const cartService = new CartService(
    cartRepository,
    variantRepository
);
