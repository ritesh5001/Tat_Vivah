/**
 * Cache key constants for all domains
 */
export declare const CACHE_KEYS: {
    readonly CATEGORIES_LIST: "categories:list";
    readonly PRODUCTS_LIST: "products:list";
    readonly PRODUCT_DETAIL: (id: string) => string;
    readonly BESTSELLERS_LIST: "products:bestsellers";
    readonly OCCASIONS_LIST: "occasions:list";
    readonly CART: (userId: string) => string;
    readonly BUYER_ORDERS: (userId: string) => string;
    readonly ORDER_DETAIL: (orderId: string) => string;
    readonly ADMIN_ORDERS: "admin:orders:list";
    readonly ADMIN_PAYMENTS: "admin:payments:list";
    readonly TRACKING: (orderId: string) => string;
    readonly SELLER_ANALYTICS_SUMMARY: (sellerId: string, start?: string, end?: string) => string;
    readonly SELLER_ANALYTICS_CHART: (sellerId: string, interval: string) => string;
    readonly SELLER_ANALYTICS_TOP_PRODUCTS: (sellerId: string, limit: number) => string;
    readonly SELLER_ANALYTICS_INVENTORY: (sellerId: string) => string;
    readonly SELLER_ANALYTICS_REFUND: (sellerId: string, start?: string, end?: string) => string;
};
/**
 * Get data from cache
 * @returns Cached data or null if not found
 */
export declare function getFromCache<T>(key: string): Promise<T | null>;
/**
 * Set data in cache with optional TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
export declare function setCache<T>(key: string, data: T, ttlSeconds?: number): Promise<void>;
/**
 * Delete specific cache keys
 * @param keys - Keys to invalidate
 */
export declare function invalidateCache(...keys: string[]): Promise<void>;
/**
 * Invalidate all product-related caches
 * Used after product mutations
 */
export declare function invalidateProductCaches(productId?: string): Promise<void>;
/**
 * Invalidate category cache
 */
export declare function invalidateCategoryCache(): Promise<void>;
//# sourceMappingURL=cache.util.d.ts.map