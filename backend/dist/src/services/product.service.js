import { productRepository } from '../repositories/product.repository.js';
import { variantRepository } from '../repositories/variant.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { getFromCache, setCache, invalidateProductCaches, CACHE_KEYS, } from '../utils/cache.util.js';
import { ApiError } from '../errors/ApiError.js';
/**
 * Product Service
 * Business logic for product, variant, and inventory operations
 */
export class ProductService {
    productRepo;
    variantRepo;
    inventoryRepo;
    categoryRepo;
    constructor(productRepo, variantRepo, inventoryRepo, categoryRepo) {
        this.productRepo = productRepo;
        this.variantRepo = variantRepo;
        this.inventoryRepo = inventoryRepo;
        this.categoryRepo = categoryRepo;
    }
    toNumber(value) {
        if (typeof value === 'number')
            return value;
        return Number(value ?? 0);
    }
    toPublicProduct(product) {
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
            price: this.toNumber(product.adminListingPrice),
        };
    }
    toPublicProductDetail(product) {
        const listingPrice = this.toNumber(product.adminListingPrice);
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
            price: listingPrice,
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
    // =========================================================================
    // PUBLIC METHODS (Buyer)
    // =========================================================================
    /**
     * List published products with pagination
     * Uses Redis caching
     */
    async listProducts(filters) {
        // Only cache if no filters (default listing)
        const useCache = !filters.categoryId && !filters.search && filters.page === 1;
        if (useCache) {
            const cached = await getFromCache(CACHE_KEYS.PRODUCTS_LIST);
            if (cached) {
                return cached;
            }
        }
        const { products, total } = await this.productRepo.findPublished(filters);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const response = {
            data: products.map((product) => this.toPublicProduct(product)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        // Cache only default listing
        if (useCache) {
            await setCache(CACHE_KEYS.PRODUCTS_LIST, response);
        }
        return response;
    }
    /**
     * Get product by ID with full details
     * Uses Redis caching
     */
    async getProductById(id) {
        // Try cache first
        const cached = await getFromCache(CACHE_KEYS.PRODUCT_DETAIL(id));
        if (cached) {
            return cached;
        }
        const product = await this.productRepo.findPublishedById(id);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }
        const response = { product: this.toPublicProductDetail(product) };
        // Cache the result
        await setCache(CACHE_KEYS.PRODUCT_DETAIL(id), response);
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
    async listSellerProducts(sellerId) {
        const products = await this.productRepo.findBySellerId(sellerId);
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
        const product = await this.productRepo.update(productId, data);
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
export const productService = new ProductService(productRepository, variantRepository, inventoryRepository, categoryRepository);
//# sourceMappingURL=product.service.js.map