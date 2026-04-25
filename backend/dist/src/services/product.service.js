import { productRepository } from '../repositories/product.repository.js';
import { variantRepository } from '../repositories/variant.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { prisma } from '../config/db.js';
import { getFromCache, setCache, invalidateProductCaches, CACHE_KEYS, } from '../utils/cache.util.js';
import { ApiError } from '../errors/ApiError.js';
import { occasionService } from './occasion.service.js';
import { normalizeVariantColorKey, resolveColorScopedGallery, sanitizeVariantImages, } from './color-variant-images.service.js';
import { dispatchFreshness } from '../live/freshness.service.js';
import { CACHE_TAGS, productTag } from '../live/cache-tags.js';
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
    resolveCheapestVariant(variants) {
        if (!Array.isArray(variants) || variants.length === 0) {
            return null;
        }
        let cheapest = null;
        for (const variant of variants) {
            const price = Number(variant?.price);
            if (!Number.isFinite(price) || price <= 0)
                continue;
            const compareRaw = Number(variant?.compareAtPrice);
            const compareAtPrice = Number.isFinite(compareRaw) && compareRaw > 0 ? compareRaw : null;
            if (!cheapest || price < cheapest.price) {
                cheapest = { price, compareAtPrice };
            }
        }
        return cheapest;
    }
    resolveListingPricing(product) {
        const variantPrice = Number(product?.cheapestVariantPrice);
        const variantCompare = Number(product?.cheapestVariantCompareAt);
        const fallbackSelling = Math.max(this.toNumber(product?.adminListingPrice), this.toNumber(product?.sellerPrice));
        const sellingPrice = Number.isFinite(variantPrice) && variantPrice > 0 ? variantPrice : fallbackSelling;
        const regularPrice = Math.max(sellingPrice, Number.isFinite(variantCompare) && variantCompare > 0 ? variantCompare : 0);
        return { sellingPrice, regularPrice };
    }
    resolveDetailPricing(product) {
        const cheapest = this.resolveCheapestVariant(product?.variants ?? []);
        const fallbackSelling = Math.max(this.toNumber(product?.adminListingPrice), this.toNumber(product?.sellerPrice));
        const sellingPrice = cheapest?.price ?? fallbackSelling;
        const regularPrice = Math.max(sellingPrice, cheapest?.compareAtPrice ?? 0);
        return { sellingPrice, regularPrice };
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
        const { sellingPrice, regularPrice } = this.resolveListingPricing(product);
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
            adminPrice: sellingPrice,
            salePrice: sellingPrice,
            price: sellingPrice,
            activeCoupon: this.getBestCouponPreview(sellingPrice, product.sellerId, coupons),
        };
    }
    toPublicProductDetail(product, coupons = []) {
        const { sellingPrice, regularPrice } = this.resolveDetailPricing(product);
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
            adminPrice: sellingPrice,
            salePrice: sellingPrice,
            price: sellingPrice,
            activeCoupon: this.getBestCouponPreview(sellingPrice, product.sellerId, coupons),
            variants: (product.variants ?? []).map((variant) => ({
                id: variant.id,
                size: variant.size ?? 'Default',
                color: variant.color ?? null,
                images: variant.images ?? [],
                sku: variant.sku,
                price: this.toNumber(variant.price),
                compareAtPrice: variant.compareAtPrice ?? null,
                inventory: variant.inventory ?? null,
            })),
        };
    }
    toSellerProduct(product) {
        return {
            id: product.id,
            sellerId: product.sellerId,
            categoryId: product.categoryId,
            title: product.title,
            description: product.description ?? null,
            images: product.images ?? [],
            sellerPrice: this.toNumber(product.sellerPrice),
            status: product.status,
            rejectionReason: product.rejectionReason ?? null,
            approvedAt: product.approvedAt ?? null,
            approvedById: product.approvedById ?? null,
            isPublished: Boolean(product.isPublished),
            deletedByAdmin: Boolean(product.deletedByAdmin),
            deletedByAdminAt: product.deletedByAdminAt ?? null,
            deletedByAdminReason: product.deletedByAdminReason ?? null,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            category: product.category,
            occasionIds: product.occasionIds ?? [],
            variants: (product.variants ?? []).map((variant) => ({
                id: variant.id,
                size: variant.size ?? 'Default',
                color: variant.color ?? null,
                images: variant.images ?? [],
                sku: variant.sku,
                sellerPrice: this.toNumber(variant.sellerPrice),
                compareAtPrice: variant.compareAtPrice == null ? null : this.toNumber(variant.compareAtPrice),
                status: variant.status,
                rejectionReason: variant.rejectionReason ?? null,
                approvedAt: variant.approvedAt ?? null,
                inventory: variant.inventory ?? null,
            })),
        };
    }
    validateCreateVariantPayload(data) {
        if (!data.size?.trim()) {
            throw ApiError.badRequest('Variant size is required');
        }
        if (!data.sku?.trim()) {
            throw ApiError.badRequest('Variant SKU is required');
        }
        if (!Number.isFinite(data.sellerPrice) || data.sellerPrice <= 0) {
            throw ApiError.badRequest('Variant seller price must be positive');
        }
        if (data.compareAtPrice !== undefined &&
            data.compareAtPrice !== null &&
            data.compareAtPrice <= data.sellerPrice) {
            throw ApiError.badRequest('Compare-at price must be greater than seller price');
        }
    }
    validateUpdateVariantPayload(data, current) {
        const nextSellerPrice = data.sellerPrice ?? current.sellerPrice;
        const nextAdminListingPrice = data.adminListingPrice !== undefined ? data.adminListingPrice : current.adminListingPrice;
        if (!Number.isFinite(nextSellerPrice) || nextSellerPrice <= 0) {
            throw ApiError.badRequest('Variant seller price must be positive');
        }
        const effectivePrice = nextAdminListingPrice ?? nextSellerPrice;
        if (data.compareAtPrice !== undefined &&
            data.compareAtPrice !== null &&
            data.compareAtPrice <= effectivePrice) {
            throw ApiError.badRequest('Compare-at price must be greater than effective selling price');
        }
    }
    async ensureProductVariantUniqueness(productId, data, excludeId) {
        const [skuExists, comboExists] = await Promise.all([
            this.variantRepo.skuExists(productId, data.sku, excludeId),
            this.variantRepo.variantCombinationExists(productId, data.size, data.color, excludeId),
        ]);
        if (skuExists) {
            throw ApiError.conflict('This SKU already exists for the product');
        }
        if (comboExists) {
            throw ApiError.conflict('This size/color combination already exists for the product');
        }
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
    async publishProductFreshness(type, productId) {
        await dispatchFreshness({
            type,
            entityId: productId,
            tags: [
                CACHE_TAGS.products,
                CACHE_TAGS.search,
                CACHE_TAGS.categories,
                CACHE_TAGS.occasions,
                CACHE_TAGS.sellerProducts,
                CACHE_TAGS.adminProducts,
                productTag(productId),
            ],
            audience: { allAuthenticated: true },
        });
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
        const normalizedVariants = (data.variants ?? []).map((variant) => ({
            size: variant.size,
            color: variant.color ?? undefined,
            images: sanitizeVariantImages(variant.images),
            sku: variant.sku,
            sellerPrice: variant.sellerPrice,
            compareAtPrice: variant.compareAtPrice,
            initialStock: variant.initialStock,
        }));
        // Validate category exists
        const categoryExists = await this.categoryRepo.existsAndActive(data.categoryId);
        if (!categoryExists) {
            throw ApiError.badRequest('Invalid category ID');
        }
        if (!Array.isArray(normalizedVariants) || normalizedVariants.length === 0) {
            throw ApiError.badRequest('At least one variant is required');
        }
        for (const variant of normalizedVariants) {
            this.validateCreateVariantPayload(variant);
        }
        const seenSkus = new Set();
        const seenCombos = new Set();
        for (const variant of normalizedVariants) {
            const skuKey = variant.sku.trim().toLowerCase();
            const comboKey = `${variant.size.trim().toLowerCase()}::${(variant.color ?? '').trim().toLowerCase()}`;
            if (seenSkus.has(skuKey)) {
                throw ApiError.conflict('Duplicate SKUs are not allowed in the same product');
            }
            if (seenCombos.has(comboKey)) {
                throw ApiError.conflict('Duplicate size/color combinations are not allowed in the same product');
            }
            seenSkus.add(skuKey);
            seenCombos.add(comboKey);
        }
        const product = await this.productRepo.create(sellerId, {
            ...data,
            variants: normalizedVariants,
        });
        // Sync occasion associations if provided
        if (data.occasionIds && data.occasionIds.length > 0) {
            await this.occasionSvc.syncProductOccasions(product.id, data.occasionIds);
        }
        // Invalidate product list cache
        await invalidateProductCaches();
        await this.publishProductFreshness('product.updated', product.id);
        const productWithDetails = await this.productRepo.findByIdWithDetails(product.id);
        if (!productWithDetails) {
            throw ApiError.internal('Unable to reload product after creation');
        }
        return {
            message: 'Product submitted for approval',
            product: this.toSellerProduct(productWithDetails),
        };
    }
    /**
     * List seller's own products
     * No caching (private data)
     */
    async listSellerProducts(sellerId, params) {
        const page = Math.max(1, Math.trunc(params?.page ?? 1));
        const limit = Math.min(20, Math.max(1, Math.trunc(params?.limit ?? 20)));
        const products = await this.productRepo.findBySellerId(sellerId, { page, limit });
        return { products: products.map((product) => this.toSellerProduct(product)) };
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
        await this.productRepo.update(productId, data);
        // Sync occasion associations if provided
        if (data.occasionIds !== undefined) {
            await this.occasionSvc.syncProductOccasions(productId, data.occasionIds ?? []);
        }
        // Invalidate caches
        await invalidateProductCaches(productId);
        await this.publishProductFreshness('product.updated', productId);
        const productWithDetails = await this.productRepo.findByIdWithDetails(productId);
        if (!productWithDetails) {
            throw ApiError.internal('Unable to reload product after update');
        }
        return {
            message: 'Product updated successfully',
            product: this.toSellerProduct(productWithDetails),
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
        await this.publishProductFreshness('product.updated', productId);
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
        if (product.deletedByAdmin) {
            throw ApiError.badRequest('Variants cannot be added to a product removed by admin');
        }
        this.validateCreateVariantPayload(data);
        await this.ensureProductVariantUniqueness(productId, {
            size: data.size,
            color: data.color,
            sku: data.sku,
        });
        const productWithDetails = await this.productRepo.findByIdWithDetails(productId);
        if (!productWithDetails) {
            throw ApiError.notFound('Product not found');
        }
        const resolvedImages = data.images !== undefined
            ? sanitizeVariantImages(data.images)
            : resolveColorScopedGallery(productWithDetails.variants ?? [], data.color);
        const variant = await this.variantRepo.create(productId, {
            ...data,
            images: resolvedImages,
        });
        await this.productRepo.syncVariantSummary(productId);
        // Invalidate caches
        await invalidateProductCaches(productId);
        await this.publishProductFreshness('inventory.updated', productId);
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
        if (variantWithProduct.product.deletedByAdmin) {
            throw ApiError.badRequest('Cannot update variants for products removed by admin');
        }
        this.validateUpdateVariantPayload(data, {
            sellerPrice: variantWithProduct.sellerPrice,
            adminListingPrice: variantWithProduct.adminListingPrice,
        });
        const nextSize = data.size ?? variantWithProduct.size;
        const nextColor = data.color !== undefined ? data.color : variantWithProduct.color;
        const nextSku = data.sku ?? variantWithProduct.sku;
        await this.ensureProductVariantUniqueness(variantWithProduct.productId, { size: nextSize, color: nextColor, sku: nextSku }, variantId);
        const productWithDetails = await this.productRepo.findByIdWithDetails(variantWithProduct.productId);
        if (!productWithDetails) {
            throw ApiError.notFound('Product not found');
        }
        const siblingVariants = (productWithDetails.variants ?? []).filter((variant) => variant.id !== variantId);
        const currentColorKey = normalizeVariantColorKey(variantWithProduct.color);
        const nextColorKey = normalizeVariantColorKey(nextColor);
        const inferredImages = data.images !== undefined
            ? sanitizeVariantImages(data.images)
            : (() => {
                const inherited = resolveColorScopedGallery(siblingVariants, nextColor);
                if (inherited.length > 0) {
                    return inherited;
                }
                if (currentColorKey === nextColorKey) {
                    return sanitizeVariantImages(variantWithProduct.images);
                }
                return [];
            })();
        const variant = await this.variantRepo.update(variantId, {
            ...data,
            images: inferredImages,
            adminListingPrice: null,
            status: 'PENDING',
            rejectionReason: null,
            approvedAt: null,
            approvedById: null,
        });
        await this.productRepo.syncVariantSummary(variantWithProduct.productId);
        // Invalidate caches
        await invalidateProductCaches(variantWithProduct.productId);
        await this.publishProductFreshness('inventory.updated', variantWithProduct.productId);
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
        if (variantWithProduct.product.deletedByAdmin) {
            throw ApiError.badRequest('Cannot update stock for products removed by admin');
        }
        const inventory = await this.inventoryRepo.updateStock(variantId, stock);
        // Invalidate caches
        await invalidateProductCaches(variantWithProduct.productId);
        await this.publishProductFreshness('inventory.updated', variantWithProduct.productId);
        return {
            message: 'Stock updated successfully',
            inventory,
        };
    }
}
// Export singleton instance with default repositories
export const productService = new ProductService(productRepository, variantRepository, inventoryRepository, categoryRepository, occasionService);
//# sourceMappingURL=product.service.js.map