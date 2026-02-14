import { cartRepository } from '../repositories/cart.repository.js';
import { variantRepository } from '../repositories/variant.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { getFromCache, setCache, invalidateCache, CACHE_KEYS, } from '../utils/cache.util.js';
import { ApiError } from '../errors/ApiError.js';
/**
 * Cart Service
 * Business logic for shopping cart operations
 */
export class CartService {
    cartRepo;
    variantRepo;
    inventoryRepo;
    constructor(cartRepo, variantRepo, inventoryRepo) {
        this.cartRepo = cartRepo;
        this.variantRepo = variantRepo;
        this.inventoryRepo = inventoryRepo;
    }
    /**
     * Get user's cart with items
     * Uses Redis caching
     */
    async getCart(userId) {
        // Try cache first
        const cached = await getFromCache(CACHE_KEYS.CART(userId));
        if (cached) {
            return cached;
        }
        // Ensure cart exists
        await this.cartRepo.findOrCreateByUserId(userId);
        // Get cart with details
        const cart = await this.cartRepo.getCartWithDetails(userId);
        if (!cart) {
            throw ApiError.internal('Failed to create cart');
        }
        const response = { cart };
        // Cache the result
        await setCache(CACHE_KEYS.CART(userId), response);
        return response;
    }
    /**
     * Add item to cart
     * Validates stock availability and snapshots price
     */
    async addItem(userId, data) {
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
        const inventory = await this.inventoryRepo.findByVariantId(data.variantId);
        const availableStock = inventory?.stock ?? 0;
        if (data.quantity > availableStock) {
            throw ApiError.badRequest(`Insufficient stock. Available: ${availableStock}, Requested: ${data.quantity}`);
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
    async updateItem(userId, itemId, quantity) {
        // 1. Find item with cart for ownership check
        const itemWithCart = await this.cartRepo.findItemByIdWithCart(itemId);
        if (!itemWithCart) {
            throw ApiError.notFound('Cart item not found');
        }
        // 2. Verify ownership
        if (itemWithCart.cart.userId !== userId) {
            throw ApiError.forbidden('You do not have permission to update this item');
        }
        // 3. Check stock availability
        const inventory = await this.inventoryRepo.findByVariantId(itemWithCart.variantId);
        const availableStock = inventory?.stock ?? 0;
        if (quantity > availableStock) {
            throw ApiError.badRequest(`Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`);
        }
        // 4. Get current price for snapshot update
        const variant = await this.variantRepo.findById(itemWithCart.variantId);
        const variantWithProduct = await this.variantRepo.findByIdWithProduct(itemWithCart.variantId);
        const currentPrice = variantWithProduct?.product?.adminListingPrice != null
            ? Number(variantWithProduct.product.adminListingPrice)
            : variant?.price ?? itemWithCart.priceSnapshot;
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
    async removeItem(userId, itemId) {
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
export const cartService = new CartService(cartRepository, variantRepository, inventoryRepository);
//# sourceMappingURL=cart.service.js.map