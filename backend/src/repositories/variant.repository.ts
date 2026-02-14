import { prisma } from '../config/db.js';
import type {
    ProductVariantEntity,
    VariantWithInventory,
    CreateVariantRequest,
    UpdateVariantRequest,
} from '../types/product.types.js';

/**
 * Variant Repository
 * Handles database operations for product variants
 */
export class VariantRepository {
    /**
     * Create a variant with initial inventory
     */
    async create(productId: string, data: CreateVariantRequest): Promise<VariantWithInventory> {
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
        return variant as VariantWithInventory;
    }

    /**
     * Find variant by ID
     */
    async findById(id: string): Promise<ProductVariantEntity | null> {
        return prisma.productVariant.findUnique({
            where: { id },
        });
    }

    /**
     * Find variant by ID with inventory
     */
    async findByIdWithInventory(id: string): Promise<VariantWithInventory | null> {
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
    async findByIdWithProduct(id: string): Promise<{
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
    } | null> {
        const variant = await prisma.productVariant.findUnique({
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

        if (!variant) {
            return null;
        }

        return {
            ...variant,
            product: {
                ...variant.product,
                adminListingPrice:
                    variant.product.adminListingPrice == null
                        ? null
                        : Number(variant.product.adminListingPrice),
            },
        };
    }

    /**
     * Update a variant
     */
    async update(id: string, data: UpdateVariantRequest): Promise<ProductVariantEntity> {
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
    async skuExists(productId: string, sku: string): Promise<boolean> {
        const variant = await prisma.productVariant.findFirst({
            where: { productId, sku },
            select: { id: true },
        });
        return variant !== null;
    }
}

// Export singleton instance
export const variantRepository = new VariantRepository();
