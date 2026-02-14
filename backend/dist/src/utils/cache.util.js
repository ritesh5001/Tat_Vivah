import { redis } from '../config/redis.js';
/**
 * Cache key constants for all domains
 */
export const CACHE_KEYS = {
    // Category & Product domain
    CATEGORIES_LIST: 'categories:list',
    PRODUCTS_LIST: 'products:list',
    PRODUCT_DETAIL: (id) => `products:detail:${id}`,
    BESTSELLERS_LIST: 'products:bestsellers',
    // Cart & Orders domain
    CART: (userId) => `cart:${userId}`,
    BUYER_ORDERS: (userId) => `orders:buyer:${userId}`,
    ORDER_DETAIL: (orderId) => `orders:detail:${orderId}`,
    // Admin domain
    ADMIN_ORDERS: 'admin:orders:list',
    ADMIN_PAYMENTS: 'admin:payments:list',
    // Shipping domain
    TRACKING: (orderId) => `tracking:${orderId}`,
};
/**
 * Default cache TTL in seconds (5 minutes)
 */
const DEFAULT_TTL = 300;
/**
 * Get data from cache
 * @returns Cached data or null if not found
 */
export async function getFromCache(key) {
    try {
        const data = await redis.get(key);
        return data;
    }
    catch (error) {
        console.error(`Cache GET error for key ${key}:`, error);
        return null;
    }
}
/**
 * Set data in cache with optional TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
export async function setCache(key, data, ttlSeconds = DEFAULT_TTL) {
    try {
        await redis.set(key, data, { ex: ttlSeconds });
    }
    catch (error) {
        console.error(`Cache SET error for key ${key}:`, error);
    }
}
/**
 * Delete specific cache keys
 * @param keys - Keys to invalidate
 */
export async function invalidateCache(...keys) {
    try {
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
    catch (error) {
        console.error('Cache DELETE error:', error);
    }
}
/**
 * Invalidate all product-related caches
 * Used after product mutations
 */
export async function invalidateProductCaches(productId) {
    const keysToInvalidate = [
        CACHE_KEYS.PRODUCTS_LIST,
    ];
    if (productId) {
        keysToInvalidate.push(CACHE_KEYS.PRODUCT_DETAIL(productId));
    }
    await invalidateCache(...keysToInvalidate);
}
/**
 * Invalidate category cache
 */
export async function invalidateCategoryCache() {
    await invalidateCache(CACHE_KEYS.CATEGORIES_LIST);
}
//# sourceMappingURL=cache.util.js.map