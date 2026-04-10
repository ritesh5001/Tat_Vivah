import { prisma } from '../config/db.js';
/**
 * Product Repository
 * Handles database operations for products
 */
export class ProductRepository {
    buildTextMatcher(keyword, matcher = 'contains') {
        const normalized = keyword.trim();
        if (!normalized)
            return null;
        return {
            [matcher]: normalized,
            mode: 'insensitive',
        };
    }
    buildSearchClauses(search) {
        if (!search)
            return [];
        const normalizedSearch = search.trim().replace(/\s+/g, ' ');
        if (!normalizedSearch)
            return [];
        const terms = normalizedSearch
            .split(' ')
            .map((term) => term.trim().toLowerCase())
            .filter((term) => term.length > 0);
        const containsTerms = Array.from(new Set([normalizedSearch, ...terms]))
            .filter((term) => term.length >= 2)
            .slice(0, 6);
        // Prefix fallback helps with small spelling variations (e.g. "weding" -> "wed").
        const prefixTerms = Array.from(new Set(terms.filter((term) => term.length >= 4).map((term) => term.slice(0, 3)))).slice(0, 3);
        const clauses = [];
        const pushTermClauses = (term, matcher) => {
            const textMatcher = this.buildTextMatcher(term, matcher);
            if (!textMatcher)
                return;
            clauses.push({ title: textMatcher });
            clauses.push({ description: textMatcher });
            clauses.push({ category: { is: { name: textMatcher } } });
            clauses.push({ category: { is: { slug: textMatcher } } });
            clauses.push({
                occasions: {
                    some: {
                        occasion: {
                            isActive: true,
                            OR: [{ name: textMatcher }, { slug: textMatcher }],
                        },
                    },
                },
            });
        };
        for (const term of containsTerms) {
            pushTermClauses(term, 'contains');
        }
        for (const prefix of prefixTerms) {
            pushTermClauses(prefix, 'startsWith');
        }
        return clauses;
    }
    resolvePagination(page, limit) {
        const pRaw = Number(page ?? 1);
        const lRaw = Number(limit ?? 20);
        const p = Number.isFinite(pRaw) && pRaw > 0 ? Math.trunc(pRaw) : 1;
        const l = Math.min(20, Math.max(1, Number.isFinite(lRaw) ? Math.trunc(lRaw) : 20));
        return { skip: (p - 1) * l, take: l };
    }
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
        const { page = 1, limit = 20, categoryId, search, occasion } = filters;
        const { skip, take } = this.resolvePagination(page, Math.min(limit, 20));
        const searchClauses = this.buildSearchClauses(search);
        const where = {
            status: 'APPROVED',
            deletedByAdmin: false,
            adminListingPrice: { not: null },
            ...(categoryId && { categoryId }),
            ...(searchClauses.length > 0 && { OR: searchClauses }),
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
            adminListingPrice: product.adminListingPrice == null
                ? null
                : Number(product.adminListingPrice),
            variants: (product.variants ?? []).map((variant) => ({
                ...variant,
                price: Number(variant.price),
                compareAtPrice: variant.compareAtPrice == null
                    ? null
                    : Number(variant.compareAtPrice),
            })),
        };
        return mapped;
    }
    /**
     * Find all products for a seller
     */
    async findBySellerId(sellerId, params) {
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
                ...(data.sellerPrice !== undefined && { sellerPrice: data.sellerPrice }),
                ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
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