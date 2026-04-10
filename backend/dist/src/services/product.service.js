import { productRepository } from '../repositories/product.repository.js';
import { variantRepository } from '../repositories/variant.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { prisma } from '../config/db.js';
import { getFromCache, setCache, invalidateProductCaches, CACHE_KEYS, } from '../utils/cache.util.js';
import { ApiError } from '../errors/ApiError.js';
import { occasionService } from './occasion.service.js';
/**
 * Product Service
 * Business logic for product, variant, and inventory operations
 */
export class ProductService {
    productRepo;
    variantRepo;
    inventoryRepo;
    categoryRepo;
    occasionSvc;
    constructor(productRepo, variantRepo, inventoryRepo, categoryRepo, occasionSvc) {
        this.productRepo = productRepo;
        this.variantRepo = variantRepo;
        this.inventoryRepo = inventoryRepo;
        this.categoryRepo = categoryRepo;
        this.occasionSvc = occasionSvc;
    }
    toNumber(value) {
        if (typeof value === 'number')
            return value;
        return Number(value ?? 0);
    }
    roundMoney(value) {
        return Math.round(value * 100) / 100;
    }
    calculateDiscountedPrice(price, coupon) {
        if (!Number.isFinite(price) || price <= 0)
            return null;
        if (price < coupon.minOrderAmount)
            return null;
        let discount = coupon.type === 'PERCENT' ? (price * coupon.value) / 100 : coupon.value;
        if (coupon.maxDiscountAmount !== null) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
        }
        discount = Math.max(0, discount);
        if (discount <= 0)
            return null;
        const discountedPrice = Math.max(0, price - discount);
        if (discountedPrice >= price)
            return null;
        return this.roundMoney(discountedPrice);
    }
    getBestCouponPreview(price, sellerId, coupons) {
        if (!sellerId || !Number.isFinite(price) || price <= 0 || coupons.length === 0) {
            return null;
        }
        let best = null;
        for (const coupon of coupons) {
            if (coupon.sellerId && coupon.sellerId !== sellerId)
                continue;
            const discountedPrice = this.calculateDiscountedPrice(price, coupon);
            if (discountedPrice === null)
                continue;
            if (!best || discountedPrice < best.discountedPrice) {
                best = {
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value,
                    maxDiscountAmount: coupon.maxDiscountAmount,
                    minOrderAmount: coupon.minOrderAmount,
                    discountedPrice,
                };
            }
        }
        return best;
    }
    async getActiveCouponsForSellers(sellerIds) {
        if (sellerIds.length === 0)
            return [];
        const uniqueSellerIds = Array.from(new Set(sellerIds.filter((id) => typeof id === 'string' && id.length > 0)));
        if (uniqueSellerIds.length === 0)
            return [];
        const now = new Date();
        const coupons = await prisma.coupon.findMany({
            where: {
                isActive: true,
                firstTimeUserOnly: false,
                validFrom: { lte: now },
                validUntil: { gte: now },
                OR: [{ sellerId: null }, { sellerId: { in: uniqueSellerIds } }],
            },
            select: {
                code: true,
                type: true,
                value: true,
                maxDiscountAmount: true,
                minOrderAmount: true,
                sellerId: true,
                usageLimit: true,
                usedCount: true,
            },
            orderBy: [{ validUntil: 'asc' }, { createdAt: 'desc' }],
        });
        return coupons
            .filter((coupon) => coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit)
            .map((coupon) => ({
            code: coupon.code,
            type: coupon.type,
            value: this.toNumber(coupon.value),
            maxDiscountAmount: coupon.maxDiscountAmount === null ? null : this.toNumber(coupon.maxDiscountAmount),
            minOrderAmount: this.toNumber(coupon.minOrderAmount),
            sellerId: coupon.sellerId,
        }))
            .filter((coupon) => coupon.value > 0);
    }
    toPublicProduct(product, coupons = []) {
        const adminPrice = this.toNumber(product.adminListingPrice);
        const sellerPrice = this.toNumber(product.sellerPrice);
        const regularPrice = sellerPrice > adminPrice ? sellerPrice : adminPrice;
        return {
            id: product.id,
            categoryId: product.categoryId,
            title: product.title,
            description: product.description ?? null,
            images: product.images ?? [],
            status: product.status,
            isPublished: Boolean(product.isPublished),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            category: product.category,
            regularPrice,
            adminPrice,
            salePrice: adminPrice,
            price: adminPrice,
            activeCoupon: this.getBestCouponPreview(adminPrice, product.sellerId, coupons),
        };
    }
    toPublicProductDetail(product, coupons = []) {
        const listingPrice = this.toNumber(product.adminListingPrice);
        const sellerPrice = this.toNumber(product.sellerPrice);
        const regularPrice = sellerPrice > listingPrice ? sellerPrice : listingPrice;
        return {
            id: product.id,
            sellerId: product.sellerId,
            categoryId: product.categoryId,
            title: product.title,
            description: product.description ?? null,
            images: product.images ?? [],
            status: product.status,
            isPublished: Boolean(product.isPublished),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            category: product.category,
            regularPrice,
            adminPrice: listingPrice,
            salePrice: listingPrice,
            price: listingPrice,
            activeCoupon: this.getBestCouponPreview(listingPrice, product.sellerId, coupons),
            variants: (product.variants ?? []).map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                price: listingPrice,
                compareAtPrice: variant.compareAtPrice ?? null,
                inventory: variant.inventory ?? null,
            })),
        };
    }
    toSellerProduct(product) {
        return {
            ...product,
            sellerPrice: this.toNumber(product.sellerPrice),
            adminListingPrice: product.adminListingPrice === null || product.adminListingPrice === undefined
                ? null
                : this.toNumber(product.adminListingPrice),
        };
    }
    normalizeTextFilter(value) {
        if (!value)
            return undefined;
        const normalized = value.trim().replace(/\s+/g, ' ');
        return normalized.length > 0 ? normalized : undefined;
    }
    normalizeListFilters(filters) {
        const pageRaw = Number(filters.page ?? 1);
        const limitRaw = Number(filters.limit ?? 20);
        return {
            ...filters,
            page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : 1,
            limit: Math.min(20, Math.max(1, Number.isFinite(limitRaw) ? Math.trunc(limitRaw) : 20)),
            categoryId: this.normalizeTextFilter(filters.categoryId),
            search: this.normalizeTextFilter(filters.search),
            occasion: this.normalizeTextFilter(filters.occasion)?.toLowerCase(),
        };
    }
    // =========================================================================
    // PUBLIC METHODS (Buyer)
    // =========================================================================
    /**
     * List published products with pagination
     * Uses Redis caching
     */
    async listProducts(filters) {
        const normalizedFilters = this.normalizeListFilters(filters);
        const page = normalizedFilters.page ?? 1;
        const limit = normalizedFilters.limit ?? 20;
        const cacheKey = !normalizedFilters.categoryId && !normalizedFilters.search && !normalizedFilters.occasion && page === 1 && limit === 20
            ? CACHE_KEYS.PRODUCTS_LIST
            : CACHE_KEYS.PRODUCTS_LIST_FILTERED(page, limit, normalizedFilters.categoryId, normalizedFilters.search, normalizedFilters.occasion);
        const cached = await getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        const { products, total } = await this.productRepo.findPublished(normalizedFilters);
        const coupons = await this.getActiveCouponsForSellers(products.map((product) => product.sellerId));
        const response = {
            data: products.map((product) => this.toPublicProduct(product, coupons)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        await setCache(cacheKey, response, page === 1 ? 120 : 90);
        return response;
    }
    /**
     * Get product by ID with full details
     * Uses Redis caching
     */
    async getProductById(id) {
        // Try cache first
        const cacheKey = CACHE_KEYS.PRODUCT_DETAIL(id);
        const cached = await getFromCache(cacheKey);
        if (cached?.product?.sellerId) {
            return cached;
        }
        const product = await this.productRepo.findPublishedById(id);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }
        const coupons = await this.getActiveCouponsForSellers([product.sellerId]);
        const response = { product: this.toPublicProductDetail(product, coupons) };
        // Cache the result
        await setCache(cacheKey, response, 60);
        return response;
    }
    // =========================================================================
    // SELLER METHODS
    // =========================================================================
    /**
     * Create a new product (seller only)
     */
    async createProduct(sellerId, data) {
        // Validate category exists
        const categoryExists = await this.categoryRepo.existsAndActive(data.categoryId);
        if (!categoryExists) {
            throw ApiError.badRequest('Invalid category ID');
        }
        const product = await this.productRepo.create(sellerId, data);
        // Sync occasion associations if provided
        if (data.occasionIds && data.occasionIds.length > 0) {
            await this.occasionSvc.syncProductOccasions(product.id, data.occasionIds);
        }
        // Invalidate product list cache
        await invalidateProductCaches();
        return {
            message: 'Product submitted for approval',
            product: this.toSellerProduct(product),
        };
    }
    /**
     * List seller's own products
     * No caching (private data)
     */
    async listSellerProducts(sellerId, params) {
        const page = Math.max(1, Math.trunc(params?.page ?? 1));
        const limit = Math.min(20, Math.max(1, Math.trunc(params?.limit ?? 20)));
        const cacheKey = CACHE_KEYS.SELLER_PRODUCTS(sellerId, page, limit);
        const cached = await getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        const products = await this.productRepo.findBySellerId(sellerId, { page, limit });
        const response = { products: products.map((product) => this.toSellerProduct(product)) };
        await setCache(cacheKey, response, 60);
        return response;
    }
    /**
     * Update a product (seller only, ownership enforced)
     */
    async updateProduct(productId, sellerId, data) {
        // Verify ownership
        const existing = await this.productRepo.findByIdAndSeller(productId, sellerId);
        if (!existing) {
            throw ApiError.forbidden('You do not have permission to update this product');
        }
        // Validate category if changing
        if (data.categoryId) {
            const categoryExists = await this.categoryRepo.existsAndActive(data.categoryId);
            if (!categoryExists) {
                throw ApiError.badRequest('Invalid category ID');
            }
        }
        const product = await this.productRepo.update(productId, data);
        // Sync occasion associations if provided
        if (data.occasionIds !== undefined) {
            await this.occasionSvc.syncProductOccasions(productId, data.occasionIds ?? []);
        }
        // Invalidate caches
        await invalidateProductCaches(productId);
        return {
            message: 'Product updated successfully',
            product: this.toSellerProduct(product),
        };
    }
    /**
     * Delete a product (seller only, ownership enforced)
     */
    async deleteProduct(productId, sellerId) {
        // Verify ownership
        const existing = await this.productRepo.findByIdAndSeller(productId, sellerId);
        if (!existing) {
            throw ApiError.forbidden('You do not have permission to delete this product');
        }
        await this.productRepo.delete(productId);
        // Invalidate caches
        await invalidateProductCaches(productId);
        return {
            message: 'Product deleted successfully',
        };
    }
    /**
     * Add a variant to a product (seller only, ownership enforced)
     */
    async addVariant(productId, sellerId, data) {
        // Verify product ownership
        const product = await this.productRepo.findByIdAndSeller(productId, sellerId);
        if (!product) {
            throw ApiError.forbidden('You do not have permission to add variants to this product');
        }
        // Check SKU uniqueness
        const skuExists = await this.variantRepo.skuExists(productId, data.sku);
        if (skuExists) {
            throw ApiError.conflict('SKU already exists for this product');
        }
        const variant = await this.variantRepo.create(productId, data);
        // Invalidate caches
        await invalidateProductCaches(productId);
        return {
            message: 'Variant created successfully',
            variant,
        };
    }
    /**
     * Update a variant (seller only, ownership enforced)
     */
    async updateVariant(variantId, sellerId, data) {
        // Verify ownership through product
        const variantWithProduct = await this.variantRepo.findByIdWithProduct(variantId);
        if (!variantWithProduct) {
            throw ApiError.notFound('Variant not found');
        }
        if (variantWithProduct.product.sellerId !== sellerId) {
            throw ApiError.forbidden('You do not have permission to update this variant');
        }
        const variant = await this.variantRepo.update(variantId, data);
        // Invalidate caches
        await invalidateProductCaches(variantWithProduct.productId);
        return {
            message: 'Variant updated successfully',
            variant,
        };
    }
    /**
     * Update stock for a variant (seller only, ownership enforced)
     */
    async updateStock(variantId, sellerId, stock) {
        // Verify ownership through product
        const variantWithProduct = await this.variantRepo.findByIdWithProduct(variantId);
        if (!variantWithProduct) {
            throw ApiError.notFound('Variant not found');
        }
        if (variantWithProduct.product.sellerId !== sellerId) {
            throw ApiError.forbidden('You do not have permission to update this variant\'s stock');
        }
        const inventory = await this.inventoryRepo.updateStock(variantId, stock);
        // Invalidate caches
        await invalidateProductCaches(variantWithProduct.productId);
        return {
            message: 'Stock updated successfully',
            inventory,
        };
    }
}
// Export singleton instance with default repositories
export const productService = new ProductService(productRepository, variantRepository, inventoryRepository, categoryRepository, occasionService);
//# sourceMappingURL=product.service.js.map