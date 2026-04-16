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
        const l = Math.min(20, Math.max(1, Number.isFinite(lRaw) ? Math.trunc(lRaw) : 20));
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
        const { skip, take } = this.resolvePagination(page, Math.min(limit, 20));
        const conditions: string[] = [
            `p."status" = 'APPROVED'`,
            `p."deleted_by_admin" = false`,
            `p."admin_listing_price" IS NOT NULL`,
        ];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (categoryId) {
            conditions.push(`p."category_id" = $${paramIndex}`);
            params.push(categoryId);
            paramIndex += 1;
        }

        if (search && search.trim().length > 0) {
            const pattern = `%${search.trim()}%`;
            conditions.push(`(
                p."title" ILIKE $${paramIndex}
                OR p."description" ILIKE $${paramIndex}
                OR c."name" ILIKE $${paramIndex}
                OR c."slug" ILIKE $${paramIndex}
                OR EXISTS (
                    SELECT 1
                    FROM "product_occasions" po
                    INNER JOIN "occasions" o ON o."id" = po."occasion_id"
                    WHERE po."product_id" = p."id"
                      AND o."is_active" = true
                      AND (o."name" ILIKE $${paramIndex} OR o."slug" ILIKE $${paramIndex})
                )
            )`);
            params.push(pattern);
            paramIndex += 1;
        }

        if (occasion) {
            conditions.push(`EXISTS (
                SELECT 1
                FROM "product_occasions" po
                INNER JOIN "occasions" o ON o."id" = po."occasion_id"
                WHERE po."product_id" = p."id"
                  AND o."is_active" = true
                  AND o."slug" = $${paramIndex}
            )`);
            params.push(occasion);
            paramIndex += 1;
        }

        const whereClause = conditions.join(' AND ');
        const countQuery = `
            SELECT COUNT(*)::int AS total
            FROM "products" p
            LEFT JOIN "categories" c ON c."id" = p."category_id"
            WHERE ${whereClause}
        `;

        const dataQuery = `
            SELECT
                p."id",
                p."seller_id" AS "sellerId",
                p."category_id" AS "categoryId",
                p."title",
                p."description",
                p."images",
                p."seller_price" AS "sellerPrice",
                p."admin_listing_price" AS "adminListingPrice",
                p."price_approved_at" AS "priceApprovedAt",
                p."price_approved_by_id" AS "priceApprovedById",
                p."status",
                p."rejection_reason" AS "rejectionReason",
                p."approved_at" AS "approvedAt",
                p."approved_by_id" AS "approvedById",
                p."is_published" AS "isPublished",
                p."deleted_by_admin" AS "deletedByAdmin",
                p."deleted_by_admin_at" AS "deletedByAdminAt",
                p."deleted_by_admin_reason" AS "deletedByAdminReason",
                p."created_at" AS "createdAt",
                p."updated_at" AS "updatedAt",
                cv."price" AS "cheapestVariantPrice",
                cv."compare_at_price" AS "cheapestVariantCompareAt",
                json_build_object(
                    'id', c."id",
                    'name', c."name",
                    'slug', c."slug",
                    'isActive', c."is_active"
                ) AS "category"
            FROM "products" p
            LEFT JOIN "categories" c ON c."id" = p."category_id"
            LEFT JOIN LATERAL (
                SELECT pv."price", pv."compare_at_price"
                FROM "product_variants" pv
                WHERE pv."product_id" = p."id"
                ORDER BY pv."price" ASC, pv."created_at" ASC
                LIMIT 1
            ) cv ON true
            WHERE ${whereClause}
            ORDER BY p."created_at" DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const [countRows, rows] = await Promise.all([
            prisma.$queryRawUnsafe<Array<{ total: number }>>(countQuery, ...params),
            prisma.$queryRawUnsafe<any[]>(dataQuery, ...params, take, skip),
        ]);

        const products = rows.map((product) => ({
            ...product,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice:
                product.adminListingPrice == null
                    ? null
                    : Number(product.adminListingPrice),
            cheapestVariantPrice:
                product.cheapestVariantPrice == null
                    ? null
                    : Number(product.cheapestVariantPrice),
            cheapestVariantCompareAt:
                product.cheapestVariantCompareAt == null
                    ? null
                    : Number(product.cheapestVariantCompareAt),
        }));

        return {
            products: products as ProductWithCategory[],
            total: countRows[0]?.total ?? 0,
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
                        price: true,
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
                price: Number(variant.price),
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
