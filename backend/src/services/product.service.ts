import { ProductRepository, productRepository } from '../repositories/product.repository.js';
import { VariantRepository, variantRepository } from '../repositories/variant.repository.js';
import { InventoryRepository, inventoryRepository } from '../repositories/inventory.repository.js';
import { CategoryRepository, categoryRepository } from '../repositories/category.repository.js';
import {
    getFromCache,
    setCache,
    invalidateProductCaches,
    CACHE_KEYS,
} from '../utils/cache.util.js';
import { ApiError } from '../errors/ApiError.js';
import { OccasionService, occasionService } from './occasion.service.js';
import type {
    ProductQueryFilters,
    ProductListResponse,
    ProductDetailResponse,
    SellerProductListResponse,
    ProductCreateResponse,
    ProductUpdateResponse,
    ProductDeleteResponse,
    VariantCreateResponse,
    VariantUpdateResponse,
    StockUpdateResponse,
    CreateProductRequest,
    UpdateProductRequest,
    CreateVariantRequest,
    UpdateVariantRequest,
    PublicProductWithCategory,
    PublicProductWithDetails,
} from '../types/product.types.js';

/**
 * Product Service
 * Business logic for product, variant, and inventory operations
 */
export class ProductService {
    constructor(
        private readonly productRepo: ProductRepository,
        private readonly variantRepo: VariantRepository,
        private readonly inventoryRepo: InventoryRepository,
        private readonly categoryRepo: CategoryRepository,
        private readonly occasionSvc: OccasionService
    ) { }

    private toNumber(value: unknown): number {
        if (typeof value === 'number') return value;
        return Number(value ?? 0);
    }

    private toPublicProduct(product: any): PublicProductWithCategory {
        const adminPrice = this.toNumber(product.adminListingPrice);
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
            regularPrice: adminPrice,
            adminPrice,
            salePrice: adminPrice,
            price: adminPrice,
        };
    }

    private toPublicProductDetail(product: any): PublicProductWithDetails {
        const listingPrice = this.toNumber(product.adminListingPrice);
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
            regularPrice: listingPrice,
            adminPrice: listingPrice,
            salePrice: listingPrice,
            price: listingPrice,
            variants: (product.variants ?? []).map((variant: any) => ({
                id: variant.id,
                sku: variant.sku,
                price: listingPrice,
                compareAtPrice: variant.compareAtPrice ?? null,
                inventory: variant.inventory ?? null,
            })),
        };
    }

    private toSellerProduct(product: any): any {
        return {
            ...product,
            sellerPrice: this.toNumber(product.sellerPrice),
            adminListingPrice:
                product.adminListingPrice === null || product.adminListingPrice === undefined
                    ? null
                    : this.toNumber(product.adminListingPrice),
        };
    }

    private normalizeTextFilter(value?: string): string | undefined {
        if (!value) return undefined;
        const normalized = value.trim().replace(/\s+/g, ' ');
        return normalized.length > 0 ? normalized : undefined;
    }

    private normalizeListFilters(filters: ProductQueryFilters): ProductQueryFilters {
        const pageRaw = Number(filters.page ?? 1);
        const limitRaw = Number(filters.limit ?? 20);

        return {
            ...filters,
            page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : 1,
            limit: Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? Math.trunc(limitRaw) : 20)),
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
    async listProducts(filters: ProductQueryFilters): Promise<ProductListResponse> {
        const normalizedFilters = this.normalizeListFilters(filters);
        const page = normalizedFilters.page ?? 1;
        const limit = normalizedFilters.limit ?? 20;
        const cacheKey =
            !normalizedFilters.categoryId && !normalizedFilters.search && !normalizedFilters.occasion && page === 1 && limit === 20
                ? CACHE_KEYS.PRODUCTS_LIST
                : CACHE_KEYS.PRODUCTS_LIST_FILTERED(
                    page,
                    limit,
                    normalizedFilters.categoryId,
                    normalizedFilters.search,
                    normalizedFilters.occasion,
                );

        const cached = await getFromCache<ProductListResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const { products, total } = await this.productRepo.findPublished(normalizedFilters);

        const response: ProductListResponse = {
            data: products.map((product) => this.toPublicProduct(product)),
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
    async getProductById(id: string): Promise<ProductDetailResponse> {
        // Try cache first
        const cacheKey = CACHE_KEYS.PRODUCT_DETAIL(id);
        const cached = await getFromCache<ProductDetailResponse>(cacheKey);
        if (cached?.product?.sellerId) {
            return cached;
        }

        const product = await this.productRepo.findPublishedById(id);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        const response: ProductDetailResponse = { product: this.toPublicProductDetail(product) };

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
    async createProduct(
        sellerId: string,
        data: CreateProductRequest
    ): Promise<ProductCreateResponse> {
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
    async listSellerProducts(
        sellerId: string,
        params?: { page?: number; limit?: number }
    ): Promise<SellerProductListResponse> {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 20;
        const cacheKey = CACHE_KEYS.SELLER_PRODUCTS(sellerId, page, limit);
        const cached = await getFromCache<SellerProductListResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const products = await this.productRepo.findBySellerId(sellerId, params);
        const response = { products: products.map((product) => this.toSellerProduct(product)) };
        await setCache(cacheKey, response, 60);
        return response;
    }

    /**
     * Update a product (seller only, ownership enforced)
     */
    async updateProduct(
        productId: string,
        sellerId: string,
        data: UpdateProductRequest
    ): Promise<ProductUpdateResponse> {
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
    async deleteProduct(
        productId: string,
        sellerId: string
    ): Promise<ProductDeleteResponse> {
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
    async addVariant(
        productId: string,
        sellerId: string,
        data: CreateVariantRequest
    ): Promise<VariantCreateResponse> {
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
    async updateVariant(
        variantId: string,
        sellerId: string,
        data: UpdateVariantRequest
    ): Promise<VariantUpdateResponse> {
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
    async updateStock(
        variantId: string,
        sellerId: string,
        stock: number
    ): Promise<StockUpdateResponse> {
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
export const productService = new ProductService(
    productRepository,
    variantRepository,
    inventoryRepository,
    categoryRepository,
    occasionService
);
