import { prisma } from '../config/db.js';
import { redis } from '../config/redis.js';
import { ApiError } from '../errors/ApiError.js';
import { searchLogger } from '../config/logger.js';
import {
    searchQueryTotal,
    searchNoResultTotal,
    autocompleteTotal,
    searchDurationSeconds,
} from '../config/metrics.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popularity';

export interface SearchFilters {
    q: string;
    page: number;
    limit: number;
    categoryId?: string | undefined;
    sort?: SortOption;
}

export interface SearchResultItem {
    id: string;
    title: string;
    description: string | null;
    images: string[];
    categoryId: string;
    sellerPrice: number;
    adminListingPrice: number | null;
    isPublished: boolean;
    createdAt: string;
    category: { id: string; name: string } | null;
    rank?: number;
}

export interface SearchResponse {
    data: SearchResultItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SuggestionItem {
    id: string;
    title: string;
    category?: string | null;
}

export interface RelatedProductItem {
    id: string;
    title: string;
    description: string | null;
    images: string[];
    categoryId: string;
    sellerPrice: number;
    adminListingPrice: number | null;
    category: { id: string; name: string } | null;
}

// ---------------------------------------------------------------------------
// Redis key
// ---------------------------------------------------------------------------

const TRENDING_KEY = 'search:trending';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class SearchService {
    // -----------------------------------------------------------------------
    // Full-text search with tsvector + ts_rank
    // -----------------------------------------------------------------------

    async searchProducts(filters: SearchFilters): Promise<SearchResponse> {
        const timer = searchDurationSeconds.startTimer();
        const { q, page, limit, categoryId, sort = 'relevance' } = filters;
        const offset = (page - 1) * limit;

        searchQueryTotal.inc();

        try {
            // Track in Redis trending
            this.trackTrending(q).catch(() => { /* fire-and-forget */ });

            // Build WHERE clause pieces
            const conditions: string[] = [
                `p."is_published" = true`,
                `p."deleted_by_admin" = false`,
                `p."search_vector" @@ plainto_tsquery('english', $1)`,
            ];
            const params: unknown[] = [q];
            let paramIndex = 2;

            if (categoryId) {
                conditions.push(`p."category_id" = $${paramIndex}`);
                params.push(categoryId);
                paramIndex++;
            }

            const whereClause = conditions.join(' AND ');

            // Build ORDER BY
            let orderBy: string;
            switch (sort) {
                case 'price_asc':
                    orderBy = `COALESCE(p."admin_listing_price", p."seller_price") ASC`;
                    break;
                case 'price_desc':
                    orderBy = `COALESCE(p."admin_listing_price", p."seller_price") DESC`;
                    break;
                case 'newest':
                    orderBy = `p."created_at" DESC`;
                    break;
                case 'popularity':
                    orderBy = `(
                        (SELECT COUNT(*) FROM "order_items" oi
                         INNER JOIN "product_variants" pv ON pv."id" = oi."variant_id"
                         WHERE pv."product_id" = p."id")
                        +
                        (SELECT COUNT(*) FROM "wishlist_items" wi
                         WHERE wi."product_id" = p."id")
                    ) DESC`;
                    break;
                default: // 'relevance'
                    orderBy = `ts_rank(p."search_vector", plainto_tsquery('english', $1)) DESC`;
                    break;
            }

            // Count
            const countQuery = `
                SELECT COUNT(*)::int AS total
                FROM "products" p
                WHERE ${whereClause}
            `;

            const countResult = await prisma.$queryRawUnsafe<[{ total: number }]>(
                countQuery,
                ...params,
            );
            const total = countResult[0]?.total ?? 0;

            if (total === 0) {
                searchNoResultTotal.inc();
                searchLogger.info({ q, categoryId, total: 0 }, 'search returned zero results');
                timer();
                return {
                    data: [],
                    pagination: { page, limit, total: 0, totalPages: 0 },
                };
            }

            // Data query
            const dataQuery = `
                SELECT
                    p."id",
                    p."title",
                    p."description",
                    p."images",
                    p."category_id" AS "categoryId",
                    p."seller_price" AS "sellerPrice",
                    p."admin_listing_price" AS "adminListingPrice",
                    p."is_published" AS "isPublished",
                    p."created_at" AS "createdAt",
                    ts_rank(p."search_vector", plainto_tsquery('english', $1)) AS rank,
                    json_build_object('id', c."id", 'name', c."name") AS category
                FROM "products" p
                LEFT JOIN "categories" c ON c."id" = p."category_id"
                WHERE ${whereClause}
                ORDER BY ${orderBy}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            params.push(limit, offset);

            const rows = await prisma.$queryRawUnsafe<SearchResultItem[]>(
                dataQuery,
                ...params,
            );

            // Convert Decimal values to numbers for JSON serialization
            const data = rows.map((row: any) => ({
                ...row,
                sellerPrice: Number(row.sellerPrice ?? 0),
                adminListingPrice: row.adminListingPrice != null ? Number(row.adminListingPrice) : null,
                rank: row.rank != null ? Number(row.rank) : undefined,
            }));

            const totalPages = Math.ceil(total / limit);

            searchLogger.info({ q, categoryId, sort, total, page }, 'search executed');
            timer();

            return { data, pagination: { page, limit, total, totalPages } };
        } catch (error) {
            timer();
            searchLogger.error({ q, error }, 'search query failed');
            throw error;
        }
    }

    // -----------------------------------------------------------------------
    // Autocomplete (ILIKE prefix match)
    // -----------------------------------------------------------------------

    async getSuggestions(q: string, limit: number = 8): Promise<SuggestionItem[]> {
        autocompleteTotal.inc();

        const rows = await prisma.$queryRawUnsafe<Array<{ id: string; title: string; categoryName: string | null }>>(
            `SELECT p."id", p."title", c."name" AS "categoryName"
             FROM "products" p
             LEFT JOIN "categories" c ON c."id" = p."category_id"
             WHERE p."is_published" = true
               AND p."deleted_by_admin" = false
               AND p."title" ILIKE $1
             ORDER BY p."title" ASC
             LIMIT $2`,
            `${q}%`,
            limit,
        );

        searchLogger.debug({ q, count: rows.length }, 'autocomplete suggestions');

        return rows.map((r) => ({
            id: r.id,
            title: r.title,
            category: r.categoryName ?? null,
        }));
    }

    // -----------------------------------------------------------------------
    // Trending searches (Redis sorted set)
    // -----------------------------------------------------------------------

    private async trackTrending(q: string): Promise<void> {
        const normalized = q.toLowerCase().trim();
        if (!normalized) return;
        await redis.zincrby(TRENDING_KEY, 1, normalized);
    }

    async getTrending(limit: number = 10): Promise<string[]> {
        const results = await redis.zrange(TRENDING_KEY, 0, limit - 1, { rev: true });
        return results as string[];
    }

    // -----------------------------------------------------------------------
    // Related products
    // -----------------------------------------------------------------------

    async getRelatedProducts(productId: string, limit: number = 8): Promise<RelatedProductItem[]> {
        // Find the product's category
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { categoryId: true },
        });

        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        // Same category, exclude self, random order
        const rows = await prisma.$queryRawUnsafe<RelatedProductItem[]>(
            `SELECT
                p."id",
                p."title",
                p."description",
                p."images",
                p."category_id" AS "categoryId",
                p."seller_price" AS "sellerPrice",
                p."admin_listing_price" AS "adminListingPrice",
                json_build_object('id', c."id", 'name', c."name") AS category
            FROM "products" p
            LEFT JOIN "categories" c ON c."id" = p."category_id"
            WHERE p."category_id" = $1
              AND p."id" != $2
              AND p."is_published" = true
              AND p."deleted_by_admin" = false
            ORDER BY RANDOM()
            LIMIT $3`,
            product.categoryId,
            productId,
            limit,
        );

        // Convert decimals
        let data = rows.map((row: any) => ({
            ...row,
            sellerPrice: Number(row.sellerPrice ?? 0),
            adminListingPrice: row.adminListingPrice != null ? Number(row.adminListingPrice) : null,
        }));

        // Fallback to bestsellers if fewer than 4 found
        if (data.length < 4) {
            const fallbackRows = await prisma.$queryRawUnsafe<RelatedProductItem[]>(
                `SELECT
                    p."id",
                    p."title",
                    p."description",
                    p."images",
                    p."category_id" AS "categoryId",
                    p."seller_price" AS "sellerPrice",
                    p."admin_listing_price" AS "adminListingPrice",
                    json_build_object('id', c."id", 'name', c."name") AS category
                FROM "products" p
                INNER JOIN "bestsellers" b ON b."product_id" = p."id"
                LEFT JOIN "categories" c ON c."id" = p."category_id"
                WHERE p."id" != $1
                  AND p."is_published" = true
                  AND p."deleted_by_admin" = false
                ORDER BY b."position" ASC
                LIMIT $2`,
                productId,
                limit - data.length,
            );

            const existingIds = new Set(data.map((d) => d.id));
            const extra = fallbackRows
                .filter((r: any) => !existingIds.has(r.id))
                .map((row: any) => ({
                    ...row,
                    sellerPrice: Number(row.sellerPrice ?? 0),
                    adminListingPrice: row.adminListingPrice != null ? Number(row.adminListingPrice) : null,
                }));

            data = [...data, ...extra].slice(0, limit);
        }

        searchLogger.debug({ productId, count: data.length }, 'related products');
        return data;
    }
}

// Singleton
export const searchService = new SearchService();
