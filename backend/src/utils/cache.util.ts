import {
    getCache,
    setCache as setCacheSafe,
    deleteCache,
    clearCache,
} from './cache.js';

/**
 * Cache key constants for all domains
 */
export const CACHE_KEYS = {
    // Category & Product domain
    CATEGORIES_LIST: 'categories:list',
    PRODUCTS_LIST: 'products:list',
    PRODUCTS_LIST_FILTERED: (page: number, limit: number, categoryId?: string, search?: string, occasion?: string) =>
        `products:list:${page}:${limit}:${categoryId ?? '_'}:${search ?? '_'}:${occasion ?? '_'}`,
    PRODUCT_DETAIL: (id: string) => `products:detail:${id}`,
    SELLER_PRODUCTS: (sellerId: string, page: number, limit: number) => `products:seller:${sellerId}:${page}:${limit}`,
    BESTSELLERS_LIST: 'products:bestsellers',

    // Occasions domain
    OCCASIONS_LIST: 'occasions:list',

    // Search domain
    SEARCH_RESULTS: (q: string, page: number, limit: number, categoryId?: string, sort?: string) =>
        `search:${q}:${page}:${limit}:${categoryId ?? '_'}:${sort ?? 'relevance'}`,
    SEARCH_SUGGESTIONS: (q: string, limit: number) => `search:suggest:${q}:${limit}`,
    SEARCH_RELATED: (productId: string, limit: number) => `search:related:${productId}:${limit}`,

    // Cart & Orders domain
    CART: (userId: string) => `cart:${userId}`,
    BUYER_ORDERS: (userId: string) => `orders:buyer:${userId}`,
    ORDER_DETAIL: (orderId: string) => `orders:detail:${orderId}`,

    // Review domain
    PRODUCT_REVIEWS: (productId: string, page: number, limit: number, sort: string) =>
        `reviews:${productId}:${page}:${limit}:${sort}`,

    // Recommendation domain
    RECOMMENDATIONS: (userId: string) => `recommendations:${userId}`,

    // Reels domain
    REELS_PUBLIC: (page: number, limit: number) => `reels:public:${page}:${limit}`,

    // Admin domain
    ADMIN_STATS: 'admin:stats',
    ADMIN_PROFIT_SUMMARY: (start?: string, end?: string, limit?: number) =>
        `admin:profit:${start ?? '_'}:${end ?? '_'}:${limit ?? 20}`,
    ADMIN_ORDERS: 'admin:orders:list',
    ADMIN_PAYMENTS: 'admin:payments:list',

    // Shipping domain
    TRACKING: (orderId: string) => `tracking:${orderId}`,

    // Seller Analytics domain
    SELLER_ANALYTICS_SUMMARY: (sellerId: string, start?: string, end?: string) =>
        `seller:analytics:summary:${sellerId}:${start ?? '_'}:${end ?? '_'}`,
    SELLER_ANALYTICS_CHART: (sellerId: string, interval: string) =>
        `seller:analytics:chart:${sellerId}:${interval}`,
    SELLER_ANALYTICS_TOP_PRODUCTS: (sellerId: string, limit: number) =>
        `seller:analytics:top-products:${sellerId}:${limit}`,
    SELLER_ANALYTICS_INVENTORY: (sellerId: string) =>
        `seller:analytics:inventory:${sellerId}`,
    SELLER_ANALYTICS_REFUND: (sellerId: string, start?: string, end?: string) =>
        `seller:analytics:refund:${sellerId}:${start ?? '_'}:${end ?? '_'}`,
} as const;

/**
 * Default cache TTL in seconds (5 minutes)
 */
const DEFAULT_TTL = 300;

/**
 * Get data from cache
 * @returns Cached data or null if not found
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
    return getCache<T>(key);
}

/**
 * Set data in cache with optional TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
export async function setCache<T>(
    key: string,
    data: T,
    ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
    await setCacheSafe(key, data, ttlSeconds);
}

/**
 * Delete specific cache keys
 * @param keys - Keys to invalidate
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
        await deleteCache(keys);
    }
}

export async function invalidateCacheByPattern(pattern: string): Promise<void> {
    await clearCache(pattern);
}

/**
 * Invalidate all product-related caches
 * Used after product mutations
 */
export async function invalidateProductCaches(productId?: string): Promise<void> {
    const keysToInvalidate: string[] = [
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
export async function invalidateCategoryCache(): Promise<void> {
    await invalidateCache(CACHE_KEYS.CATEGORIES_LIST);
}
