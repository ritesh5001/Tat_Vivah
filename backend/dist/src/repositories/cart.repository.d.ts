import type { CartEntity, CartItemEntity, CartWithItems, AddCartItemRequest } from '../types/cart.types.js';
/**
 * Cart Repository
 * Handles database operations for shopping carts
 */
export declare class CartRepository {
    /**
     * Find cart by user ID with items (basic - no product/variant details)
     */
    findByUserId(userId: string): Promise<({
        items: {
            variantId: string;
            id: string;
            createdAt: Date;
            productId: string;
            cartId: string;
            quantity: number;
            priceSnapshot: number;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        userId: string;
    }) | null>;
    /**
     * Find or create cart for user
     */
    findOrCreateByUserId(userId: string): Promise<CartEntity>;
    /**
     * Add item to cart (upsert - updates quantity if exists)
     */
    addItem(cartId: string, data: AddCartItemRequest & {
        priceSnapshot: number;
    }): Promise<CartItemEntity>;
    /**
     * Find cart item by ID
     */
    findItemById(itemId: string): Promise<CartItemEntity | null>;
    /**
     * Find cart item by ID with cart (for ownership check)
     */
    findItemByIdWithCart(itemId: string): Promise<(CartItemEntity & {
        cart: CartEntity;
    }) | null>;
    /**
     * Update item quantity
     */
    updateItemQuantity(itemId: string, quantity: number, priceSnapshot: number): Promise<CartItemEntity>;
    /**
     * Remove item from cart
     */
    removeItem(itemId: string): Promise<void>;
    /**
     * Clear all items from cart
     */
    clearCart(cartId: string): Promise<void>;
    /**
     * Get cart items with product and variant details
     */
    getCartWithDetails(userId: string): Promise<CartWithItems | null>;
}
export declare const cartRepository: CartRepository;
//# sourceMappingURL=cart.repository.d.ts.map