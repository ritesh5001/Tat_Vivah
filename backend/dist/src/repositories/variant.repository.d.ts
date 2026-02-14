import type { ProductVariantEntity, VariantWithInventory, CreateVariantRequest, UpdateVariantRequest } from '../types/product.types.js';
/**
 * Variant Repository
 * Handles database operations for product variants
 */
export declare class VariantRepository {
    /**
     * Create a variant with initial inventory
     */
    create(productId: string, data: CreateVariantRequest): Promise<VariantWithInventory>;
    /**
     * Find variant by ID
     */
    findById(id: string): Promise<ProductVariantEntity | null>;
    /**
     * Find variant by ID with inventory
     */
    findByIdWithInventory(id: string): Promise<VariantWithInventory | null>;
    /**
     * Find variant with product and seller info (for ownership check)
     */
    findByIdWithProduct(id: string): Promise<{
        id: string;
        productId: string;
        price: number;
        product: {
            id: string;
            sellerId: string;
            status: string;
            deletedByAdmin: boolean;
            adminListingPrice: number | null;
        };
    } | null>;
    /**
     * Update a variant
     */
    update(id: string, data: UpdateVariantRequest): Promise<ProductVariantEntity>;
    /**
     * Check if SKU exists
     */
    skuExists(productId: string, sku: string): Promise<boolean>;
}
export declare const variantRepository: VariantRepository;
//# sourceMappingURL=variant.repository.d.ts.map