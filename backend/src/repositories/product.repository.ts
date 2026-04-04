import { prisma } from '../config/db.js';
import type {
    ProductEntity,
    ProductWithCategory,
    ProductWithDetails,
    CreateProductRequest,
    UpdateProductRequest,
    ProductQueryFilters,
} from '../types/product.types.js';

/**
 * Product Repository
 * Handles database operations for products
 */
export class ProductRepository {
    private resolvePagination(page?: number, limit?: number): { skip: number; take: number } {
        const pRaw = Number(page ?? 1);
        const lRaw = Number(limit ?? 20);
        const p = Number.isFinite(pRaw) && pRaw > 0 ? Math.trunc(pRaw) : 1;
        const l = Math.min(100, Math.max(1, Number.isFinite(lRaw) ? Math.trunc(lRaw) : 20));
        return { skip: (p - 1) * l, take: l };
    }

    private mapProductDecimals<T extends { sellerPrice: unknown; adminListingPrice: unknown }>(product: T): Omit<T, 'sellerPrice' | 'adminListingPrice'> & { sellerPrice: number; adminListingPrice: number | null } {
        return {
            ...product,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice:
                product.adminListingPrice == null
                    ? null
                    : Number(product.adminListingPrice),
        };
    }

    /**
     * Find published products with pagination and filters
     */
    async findPublished(filters: ProductQueryFilters): Promise<{
        products: ProductWithCategory[];
        total: number;
    }> {
        const { page = 1, limit = 20, categoryId, search, occasion } = filters;
        const { skip, take } = this.resolvePagination(page, Math.min(limit, 50));

        const where: any = {
            status: 'APPROVED' as const,
            deletedByAdmin: false,
            adminListingPrice: { not: null },
            ...(categoryId && { categoryId }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        // Use Prisma relational filtering for occasion slug
        if (occasion) {
            where.occasions = {
                some: {
                    occasion: {
                        slug: occasion,
                        isActive: true,
                    },
                },
            };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    sellerPrice: true,
                    categoryId: true,
                    title: true,
                    description: true,
                    images: true,
                    status: true,
                    isPublished: true,
                    createdAt: true,
                    updatedAt: true,
                    adminListingPrice: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            isActive: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            products: products.map((product) => this.mapProductDecimals(product)) as ProductWithCategory[],
            total,
        };
    }

    /**
     * Find published product by ID with full details
     */
    async findPublishedById(id: string): Promise<ProductWithDetails | null> {
        const product = await prisma.product.findFirst({
            where: { id, status: 'APPROVED', deletedByAdmin: false, adminListingPrice: { not: null } },
            select: {
                id: true,
                sellerId: true,
                sellerPrice: true,
                categoryId: true,
                title: true,
                description: true,
                images: true,
                status: true,
                isPublished: true,
                createdAt: true,
                updatedAt: true,
                adminListingPrice: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                    },
                },
                variants: {
                    select: {
                        id: true,
                        sku: true,
                        compareAtPrice: true,
                        inventory: true,
                    },
                },
            },
        });

        if (!product) {
            return null;
        }

        const mapped = {
            ...product,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice:
                product.adminListingPrice == null
                    ? null
                    : Number(product.adminListingPrice),
            variants: (product.variants ?? []).map((variant) => ({
                ...variant,
                compareAtPrice:
                    variant.compareAtPrice == null
                        ? null
                        : Number(variant.compareAtPrice),
            })),
        };

        return mapped as ProductWithDetails;
    }

    /**
     * Find all products for a seller
     */
    async findBySellerId(sellerId: string, params?: { page?: number; limit?: number }): Promise<ProductWithDetails[]> {
        const { skip, take } = this.resolvePagination(params?.page, params?.limit);
        const products = await prisma.product.findMany({
            where: { sellerId },
            include: {
                category: true,
                variants: {
                    include: {
                        inventory: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });

        return products.map((product) => this.mapProductDecimals(product)) as ProductWithDetails[];
    }

    /**
     * Find product by ID and seller (ownership check)
     */
    async findByIdAndSeller(id: string, sellerId: string): Promise<ProductEntity | null> {
        const product = await prisma.product.findFirst({
            where: { id, sellerId },
        });

        return product ? this.mapProductDecimals(product) as ProductEntity : null;
    }

    /**
     * Find product by ID with details
     */
    async findByIdWithDetails(id: string): Promise<ProductWithDetails | null> {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                variants: {
                    include: {
                        inventory: true,
                    },
                },
            },
        });

        return product ? this.mapProductDecimals(product) as ProductWithDetails : null;
    }

    /**
     * Create a new product
     */
    async create(sellerId: string, data: CreateProductRequest): Promise<ProductEntity> {
        const product = await prisma.product.create({
            data: {
                sellerId,
                categoryId: data.categoryId,
                title: data.title,
                description: data.description ?? null,
                sellerPrice: data.sellerPrice,
                adminListingPrice: null,
                priceApprovedAt: null,
                priceApprovedById: null,
                images: data.images ?? [],
                status: 'PENDING',
                rejectionReason: null,
                approvedAt: null,
                approvedById: null,
                isPublished: false,
            },
        });

        return this.mapProductDecimals(product) as ProductEntity;
    }

    /**
     * Update a product
     */
    async update(id: string, data: UpdateProductRequest): Promise<ProductEntity> {
        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.images !== undefined && { images: data.images }),
                ...(data.sellerPrice !== undefined && { sellerPrice: data.sellerPrice }),
                ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
            },
        });

        return this.mapProductDecimals(product) as ProductEntity;
    }

    /**
     * Delete a product
     */
    async delete(id: string): Promise<void> {
        await prisma.product.delete({
            where: { id },
        });
    }

    /**
     * Check if product exists
     */
    async exists(id: string): Promise<boolean> {
        const product = await prisma.product.findUnique({
            where: { id },
            select: { id: true },
        });
        return product !== null;
    }
}

// Export singleton instance
export const productRepository = new ProductRepository();
