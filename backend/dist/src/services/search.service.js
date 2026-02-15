import { prisma } from '../config/db.js';
import { redis } from '../config/redis.js';
import { ApiError } from '../errors/ApiError.js';
import { searchLogger } from '../config/logger.js';
import { searchQueryTotal, searchNoResultTotal, autocompleteTotal, searchDurationSeconds, } from '../config/metrics.js';
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
    async searchProducts(filters) {
        const timer = searchDurationSeconds.startTimer();
        const { q, page, limit, categoryId, sort = 'relevance' } = filters;
        const offset = (page - 1) * limit;
        searchQueryTotal.inc();
        try {
            // Track in Redis trending
            this.trackTrending(q).catch(() => { });
            // Build WHERE clause pieces
            const conditions = [
                `p."is_published" = true`,
                `p."deleted_by_admin" = false`,
                `p."search_vector" @@ plainto_tsquery('english', $1)`,
            ];
            const params = [q];
            let paramIndex = 2;
            if (categoryId) {
                conditions.push(`p."category_id" = $${paramIndex}`);
                params.push(categoryId);
                paramIndex++;
            }
            const whereClause = conditions.join(' AND ');
            // Build ORDER BY
            let orderBy;
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
            const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
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
            const rows = await prisma.$queryRawUnsafe(dataQuery, ...params);
            // Convert Decimal values to numbers for JSON serialization
            const data = rows.map((row) => ({
                ...row,
                sellerPrice: Number(row.sellerPrice ?? 0),
                adminListingPrice: row.adminListingPrice != null ? Number(row.adminListingPrice) : null,
                rank: row.rank != null ? Number(row.rank) : undefined,
            }));
            const totalPages = Math.ceil(total / limit);
            searchLogger.info({ q, categoryId, sort, total, page }, 'search executed');
            timer();
            return { data, pagination: { page, limit, total, totalPages } };
        }
        catch (error) {
            timer();
            searchLogger.error({ q, error }, 'search query failed');
            throw error;
        }
    }
    // -----------------------------------------------------------------------
    // Autocomplete (ILIKE prefix match)
    // -----------------------------------------------------------------------
    async getSuggestions(q, limit = 8) {
        autocompleteTotal.inc();
        const rows = await prisma.$queryRawUnsafe(`SELECT p."id", p."title", c."name" AS "categoryName"
             FROM "products" p
             LEFT JOIN "categories" c ON c."id" = p."category_id"
             WHERE p."is_published" = true
               AND p."deleted_by_admin" = false
               AND p."title" ILIKE $1
             ORDER BY p."title" ASC
             LIMIT $2`, `${q}%`, limit);
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
    async trackTrending(q) {
        const normalized = q.toLowerCase().trim();
        if (!normalized)
            return;
        await redis.zincrby(TRENDING_KEY, 1, normalized);
    }
    async getTrending(limit = 10) {
        const results = await redis.zrange(TRENDING_KEY, 0, limit - 1, { rev: true });
        return results;
    }
    // -----------------------------------------------------------------------
    // Related products
    // -----------------------------------------------------------------------
    async getRelatedProducts(productId, limit = 8) {
        // Find the product's category
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { categoryId: true },
        });
        if (!product) {
            throw ApiError.notFound('Product not found');
        }
        // Same category, exclude self, random order
        const rows = await prisma.$queryRawUnsafe(`SELECT
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
            LIMIT $3`, product.categoryId, productId, limit);
        // Convert decimals
        let data = rows.map((row) => ({
            ...row,
            sellerPrice: Number(row.sellerPrice ?? 0),
            adminListingPrice: row.adminListingPrice != null ? Number(row.adminListingPrice) : null,
        }));
        // Fallback to bestsellers if fewer than 4 found
        if (data.length < 4) {
            const fallbackRows = await prisma.$queryRawUnsafe(`SELECT
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
                LIMIT $2`, productId, limit - data.length);
            const existingIds = new Set(data.map((d) => d.id));
            const extra = fallbackRows
                .filter((r) => !existingIds.has(r.id))
                .map((row) => ({
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
//# sourceMappingURL=search.service.js.map