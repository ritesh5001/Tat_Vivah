// Product & Catalog Domain Types

// ============================================================================
// ENTITY TYPES
// ============================================================================

/**
 * Category entity as returned from database
 */
export interface CategoryEntity {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    bannerImage: string | null;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    createdAt: Date;
}

/**
 * Product entity as returned from database
 */
export interface ProductEntity {
    id: string;
    sellerId: string;
    categoryId: string;
    title: string;
    description: string | null;
    images: string[];
    sellerPrice: number;
    adminListingPrice: number | null;
    priceApprovedAt: Date | null;
    priceApprovedById: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason: string | null;
    approvedAt: Date | null;
    approvedById: string | null;
    isPublished: boolean;
    deletedByAdmin: boolean;
    deletedByAdminAt: Date | null;
    deletedByAdminReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * ProductVariant entity as returned from database
 */
export interface ProductVariantEntity {
    id: string;
    productId: string;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Inventory entity as returned from database
 */
export interface InventoryEntity {
    variantId: string;
    stock: number;
    updatedAt: Date;
}

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Variant with inventory included
 */
export interface VariantWithInventory extends ProductVariantEntity {
    inventory: InventoryEntity | null;
}

/**
 * Product with category and variants
 */
export interface ProductWithDetails extends ProductEntity {
    category: CategoryEntity;
    variants: VariantWithInventory[];
}

/**
 * Product with just category (for listings)
 */
export interface ProductWithCategory extends ProductEntity {
    category: CategoryEntity;
}

export interface PublicProductVariant {
    id: string;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    inventory: InventoryEntity | null;
}

export interface PublicProductWithCategory {
    id: string;
    categoryId: string;
    title: string;
    description: string | null;
    images: string[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    category: CategoryEntity;
    regularPrice: number;
    adminPrice: number;
    salePrice: number;
    price: number;
}

export interface PublicProductWithDetails {
    id: string;
    sellerId: string;
    categoryId: string;
    title: string;
    description: string | null;
    images: string[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    category: CategoryEntity;
    variants: PublicProductVariant[];
    regularPrice: number;
    adminPrice: number;
    salePrice: number;
    price: number;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Create product request
 */
export interface CreateProductRequest {
    categoryId: string;
    title: string;
    sellerPrice: number;
    description?: string | undefined;
    isPublished?: boolean | undefined;
    images?: string[] | undefined;
    occasionIds?: string[] | undefined;
}

/**
 * Update product request
 */
export interface UpdateProductRequest {
    categoryId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    images?: string[] | undefined;
    sellerPrice?: number | undefined;
    isPublished?: boolean | undefined;
    occasionIds?: string[] | undefined;
}

/**
 * Create variant request
 */
export interface CreateVariantRequest {
    sku: string;
    price: number;
    compareAtPrice?: number | undefined;
    initialStock?: number | undefined;
}

/**
 * Update variant request
 */
export interface UpdateVariantRequest {
    price?: number | undefined;
    compareAtPrice?: number | null | undefined;
}

/**
 * Update stock request
 */
export interface UpdateStockRequest {
    stock: number;
}

/**
 * Product query filters
 */
export interface ProductQueryFilters {
    page?: number | undefined;
    limit?: number | undefined;
    categoryId?: string | undefined;
    search?: string | undefined;
    occasion?: string | undefined;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Category list response
 */
export interface CategoryListResponse {
    categories: CategoryEntity[];
}

/**
 * Product list response (paginated)
 */
export type ProductListResponse = PaginatedResponse<PublicProductWithCategory>;

/**
 * Product detail response
 */
export interface ProductDetailResponse {
    product: PublicProductWithDetails;
}

/**
 * Seller product list response
 */
export interface SellerProductListResponse {
    products: ProductWithDetails[];
}

/**
 * Product creation response
 */
export interface ProductCreateResponse {
    message: string;
    product: ProductEntity;
}

/**
 * Product update response
 */
export interface ProductUpdateResponse {
    message: string;
    product: ProductEntity;
}

/**
 * Product delete response
 */
export interface ProductDeleteResponse {
    message: string;
}

/**
 * Variant creation response
 */
export interface VariantCreateResponse {
    message: string;
    variant: VariantWithInventory;
}

/**
 * Variant update response
 */
export interface VariantUpdateResponse {
    message: string;
    variant: ProductVariantEntity;
}

/**
 * Stock update response
 */
export interface StockUpdateResponse {
    message: string;
    inventory: InventoryEntity;
}

// Export dummy to ensure module
export const _productTypesModule = true;
