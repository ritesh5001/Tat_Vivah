import { getCache, setCache as setCacheSafe, deleteCache, clearCache, } from './cache.js';
/**
 * Cache key constants for all domains
 */
export const CACHE_KEYS = {
    // Category & Product domain
    CATEGORIES_LIST: 'categories:list',
    PRODUCTS_LIST: 'products:list',
    PRODUCTS_LIST_FILTERED: (page, limit, categoryId, search, occasion) => `products:list:${page}:${limit}:${categoryId ?? '_'}:${search ?? '_'}:${occasion ?? '_'}`,
    PRODUCT_DETAIL: (id) => `products:detail:${id}`,
    SELLER_PRODUCTS: (sellerId, page, limit) => `products:seller:${sellerId}:${page}:${limit}`,
    BESTSELLERS_LIST: 'products:bestsellers',
    // Occasions domain
    OCCASIONS_LIST: 'occasions:list',
    // Search domain
    SEARCH_RESULTS: (q, page, limit, categoryId, sort) => `search:${q}:${page}:${limit}:${categoryId ?? '_'}:${sort ?? 'relevance'}`,
    SEARCH_SUGGESTIONS: (q, limit) => `search:suggest:${q}:${limit}`,
    SEARCH_RELATED: (productId, limit) => `search:related:${productId}:${limit}`,
    // Cart & Orders domain
    CART: (userId) => `cart:${userId}`,
    BUYER_ORDERS: (userId) => `orders:buyer:${userId}`,
    ORDER_DETAIL: (orderId) => `orders:detail:${orderId}`,
    // Review domain
    PRODUCT_REVIEWS: (productId, page, limit, sort) => `reviews:${productId}:${page}:${limit}:${sort}`,
    // Recommendation domain
    RECOMMENDATIONS: (userId) => `recommendations:${userId}`,
    // Reels domain
    REELS_PUBLIC: (page, limit) => `reels:public:${page}:${limit}`,
    // Admin domain
    ADMIN_STATS: 'admin:stats',
    ADMIN_PROFIT_SUMMARY: (start, end, limit) => `admin:profit:${start ?? '_'}:${end ?? '_'}:${limit ?? 20}`,
    ADMIN_ORDERS: 'admin:orders:list',
    ADMIN_PAYMENTS: 'admin:payments:list',
    // Shipping domain
    TRACKING: (orderId) => `tracking:${orderId}`,
    // Seller Analytics domain
    SELLER_ANALYTICS_SUMMARY: (sellerId, start, end) => `seller:analytics:summary:${sellerId}:${start ?? '_'}:${end ?? '_'}`,
    SELLER_ANALYTICS_CHART: (sellerId, interval) => `seller:analytics:chart:${sellerId}:${interval}`,
    SELLER_ANALYTICS_TOP_PRODUCTS: (sellerId, limit) => `seller:analytics:top-products:${sellerId}:${limit}`,
    SELLER_ANALYTICS_INVENTORY: (sellerId) => `seller:analytics:inventory:${sellerId}`,
    SELLER_ANALYTICS_REFUND: (sellerId, start, end) => `seller:analytics:refund:${sellerId}:${start ?? '_'}:${end ?? '_'}`,
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
    return getCache(key);
}
/**
 * Set data in cache with optional TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
export async function setCache(key, data, ttlSeconds = DEFAULT_TTL) {
    await setCacheSafe(key, data, ttlSeconds);
}
/**
 * Delete specific cache keys
 * @param keys - Keys to invalidate
 */
export async function invalidateCache(...keys) {
    if (keys.length > 0) {
        await deleteCache(keys);
    }
}
export async function invalidateCacheByPattern(pattern) {
    await clearCache(pattern);
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
    await invalidateCacheByPattern('products:list:*');
    await invalidateCacheByPattern('products:seller:*');
    await invalidateCacheByPattern('search:*');
    if (productId) {
        await invalidateCacheByPattern(`reviews:${productId}:*`);
        await invalidateCacheByPattern(`search:related:${productId}:*`);
    }
}
/**
 * Invalidate category cache
 */
export async function invalidateCategoryCache() {
    await invalidateCache(CACHE_KEYS.CATEGORIES_LIST);
}
//# sourceMappingURL=cache.util.js.map