import { Prisma } from '@prisma/client';
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
        private async repairLegacySkuConstraintIfNeeded(): Promise<void> {
                // Safety net for environments where old unique(product_id, sku) still exists.
                await prisma.$executeRawUnsafe(`
        DO $$
        DECLARE r RECORD;
        BEGIN
            FOR r IN
                SELECT c.conname
                FROM pg_constraint c
                JOIN pg_class t ON t.oid = c.conrelid
                JOIN pg_namespace n ON n.oid = t.relnamespace
                WHERE n.nspname = 'public'
                    AND t.relname = 'product_variants'
                    AND c.contype = 'u'
                    AND array_length(c.conkey, 1) = 2
                    AND (
                        SELECT array_agg(a.attname ORDER BY a.attname)
                        FROM unnest(c.conkey) AS k(attnum)
                        JOIN pg_attribute a
                          ON a.attrelid = t.oid
                         AND a.attnum = k.attnum
                    ) = ARRAY['product_id', 'sku']::text[]
            LOOP
                EXECUTE format('ALTER TABLE public.product_variants DROP CONSTRAINT %I', r.conname);
            END LOOP;
        END $$;
        `);

        await prisma.$executeRawUnsafe(`
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT i.relname AS index_name
        FROM pg_index ix
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_class i ON i.oid = ix.indexrelid
        LEFT JOIN pg_constraint c ON c.conindid = ix.indexrelid
        WHERE n.nspname = 'public'
            AND t.relname = 'product_variants'
            AND ix.indisunique = true
            AND ix.indnkeyatts = 2
            AND c.oid IS NULL
            AND (
                pg_get_indexdef(i.oid) ILIKE '%(product_id, sku)%'
                OR pg_get_indexdef(i.oid) ILIKE '%(sku, product_id)%'
            )
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I', r.index_name);
    END LOOP;
END $$;
`);

                await prisma.$executeRawUnsafe(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'product_variants_product_id_color_sku_key'
            AND conrelid = 'public.product_variants'::regclass
    ) THEN
        ALTER TABLE public.product_variants
        ADD CONSTRAINT product_variants_product_id_color_sku_key
        UNIQUE (product_id, color, sku);
    END IF;
END $$;
`);
        }

    /**
     * Create a variant with initial inventory
     */
    async create(productId: string, data: CreateVariantRequest): Promise<VariantWithInventory> {
        const payload = {
            productId,
            color: data.color?.trim() ? data.color.trim() : null,
            images: data.images ?? [],
            sku: data.sku,
            price: data.price,
            compareAtPrice: data.compareAtPrice ?? null,
            inventory: {
                create: {
                    stock: data.initialStock ?? 0,
                },
            },
        };

        try {
            const variant = await prisma.productVariant.create({
                data: payload,
                include: {
                    inventory: true,
                },
            });
            return variant as VariantWithInventory;
        } catch (error) {
            const isLegacySkuConstraintError =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                Array.isArray(error.meta?.target) &&
                error.meta.target.includes('product_id') &&
                error.meta.target.includes('sku');

            if (!isLegacySkuConstraintError) {
                throw error;
            }

            await this.repairLegacySkuConstraintIfNeeded();

            const retriedVariant = await prisma.productVariant.create({
                data: payload,
                include: {
                    inventory: true,
                },
            });
            return retriedVariant as VariantWithInventory;
        }
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
        color: string | null;
        images: string[];
        price: number;
        inventory: { stock: number } | null;
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
                color: true,
                images: true,
                price: true,
                inventory: {
                    select: {
                        stock: true,
                    },
                },
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
                ...(data.color !== undefined && { color: data.color?.trim() ? data.color.trim() : null }),
                ...(data.images !== undefined && { images: data.images }),
                ...(data.price !== undefined && { price: data.price }),
                ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
            },
        });
    }

    /**
     * Check if SKU exists
     */
    async skuExists(productId: string, sku: string, color?: string | null): Promise<boolean> {
        const normalizedColor = color?.trim() ? color.trim() : null;

        const variant = await prisma.productVariant.findFirst({
            where: {
                productId,
                sku,
                color:
                    normalizedColor === null
                        ? null
                        : {
                              equals: normalizedColor,
                              mode: 'insensitive',
                          },
            },
            select: { id: true },
        });
        return variant !== null;
    }
}

// Export singleton instance
export const variantRepository = new VariantRepository();
