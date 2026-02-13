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
    /**
     * Find published products with pagination and filters
     */
    async findPublished(filters: ProductQueryFilters): Promise<{
        products: ProductWithCategory[];
        total: number;
    }> {
        const { page = 1, limit = 20, categoryId, search } = filters;
        const skip = (page - 1) * limit;

        const where = {
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

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.count({ where }),
        ]);

        return { products, total };
    }

    /**
     * Find published product by ID with full details
     */
    async findPublishedById(id: string): Promise<ProductWithDetails | null> {
        return prisma.product.findFirst({
            where: { id, status: 'APPROVED', deletedByAdmin: false, adminListingPrice: { not: null } },
            include: {
                category: true,
                variants: {
                    include: {
                        inventory: true,
                    },
                },
            },
        });
    }

    /**
     * Find all products for a seller
     */
    async findBySellerId(sellerId: string): Promise<ProductWithDetails[]> {
        return prisma.product.findMany({
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
        });
    }

    /**
     * Find product by ID and seller (ownership check)
     */
    async findByIdAndSeller(id: string, sellerId: string): Promise<ProductEntity | null> {
        return prisma.product.findFirst({
            where: { id, sellerId },
        });
    }

    /**
     * Find product by ID with details
     */
    async findByIdWithDetails(id: string): Promise<ProductWithDetails | null> {
        return prisma.product.findUnique({
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
    }

    /**
     * Create a new product
     */
    async create(sellerId: string, data: CreateProductRequest): Promise<ProductEntity> {
        return prisma.product.create({
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
    }

    /**
     * Update a product
     */
    async update(id: string, data: UpdateProductRequest): Promise<ProductEntity> {
        return prisma.product.update({
            where: { id },
            data: {
                ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.images !== undefined && { images: data.images }),
            },
        });
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
