import { prisma } from '../config/db.js';
/**
 * Product Repository
 * Handles database operations for products
 */
export class ProductRepository {
    mapProductDecimals(product) {
        return {
            ...product,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice: product.adminListingPrice == null
                ? null
                : Number(product.adminListingPrice),
        };
    }
    /**
     * Find published products with pagination and filters
     */
    async findPublished(filters) {
        const { page = 1, limit = 20, categoryId, search } = filters;
        const skip = (page - 1) * limit;
        const where = {
            status: 'APPROVED',
            deletedByAdmin: false,
            adminListingPrice: { not: null },
            ...(categoryId && { categoryId }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
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
        return {
            products: products.map((product) => this.mapProductDecimals(product)),
            total,
        };
    }
    /**
     * Find published product by ID with full details
     */
    async findPublishedById(id) {
        const product = await prisma.product.findFirst({
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
        return product ? this.mapProductDecimals(product) : null;
    }
    /**
     * Find all products for a seller
     */
    async findBySellerId(sellerId) {
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
        });
        return products.map((product) => this.mapProductDecimals(product));
    }
    /**
     * Find product by ID and seller (ownership check)
     */
    async findByIdAndSeller(id, sellerId) {
        const product = await prisma.product.findFirst({
            where: { id, sellerId },
        });
        return product ? this.mapProductDecimals(product) : null;
    }
    /**
     * Find product by ID with details
     */
    async findByIdWithDetails(id) {
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
        return product ? this.mapProductDecimals(product) : null;
    }
    /**
     * Create a new product
     */
    async create(sellerId, data) {
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
        return this.mapProductDecimals(product);
    }
    /**
     * Update a product
     */
    async update(id, data) {
        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.images !== undefined && { images: data.images }),
            },
        });
        return this.mapProductDecimals(product);
    }
    /**
     * Delete a product
     */
    async delete(id) {
        await prisma.product.delete({
            where: { id },
        });
    }
    /**
     * Check if product exists
     */
    async exists(id) {
        const product = await prisma.product.findUnique({
            where: { id },
            select: { id: true },
        });
        return product !== null;
    }
}
// Export singleton instance
export const productRepository = new ProductRepository();
//# sourceMappingURL=product.repository.js.map