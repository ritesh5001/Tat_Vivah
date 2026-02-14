import { prisma } from '../config/db.js';
/**
 * Variant Repository
 * Handles database operations for product variants
 */
export class VariantRepository {
    /**
     * Create a variant with initial inventory
     */
    async create(productId, data) {
        const variant = await prisma.productVariant.create({
            data: {
                productId,
                sku: data.sku,
                price: data.price,
                compareAtPrice: data.compareAtPrice ?? null,
                inventory: {
                    create: {
                        stock: data.initialStock ?? 0,
                    },
                },
            },
            include: {
                inventory: true,
            },
        });
        return variant;
    }
    /**
     * Find variant by ID
     */
    async findById(id) {
        return prisma.productVariant.findUnique({
            where: { id },
        });
    }
    /**
     * Find variant by ID with inventory
     */
    async findByIdWithInventory(id) {
        return prisma.productVariant.findUnique({
            where: { id },
            include: {
                inventory: true,
            },
        });
    }
    /**
     * Find variant with product and seller info (for ownership check)
     */
    async findByIdWithProduct(id) {
        return prisma.productVariant.findUnique({
            where: { id },
            select: {
                id: true,
                productId: true,
                price: true,
                product: {
                    select: {
                        id: true,
                        sellerId: true,
                        status: true,
                        deletedByAdmin: true,
                        adminListingPrice: true,
                    },
                },
            },
        });
    }
    /**
     * Update a variant
     */
    async update(id, data) {
        return prisma.productVariant.update({
            where: { id },
            data: {
                ...(data.price !== undefined && { price: data.price }),
                ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
            },
        });
    }
    /**
     * Check if SKU exists
     */
    async skuExists(productId, sku) {
        const variant = await prisma.productVariant.findFirst({
            where: { productId, sku },
            select: { id: true },
        });
        return variant !== null;
    }
}
// Export singleton instance
export const variantRepository = new VariantRepository();
//# sourceMappingURL=variant.repository.js.map