/**
 * Admin Repository
 * Database operations for admin panel
 */

import { prisma } from '../config/db.js';

// ---------------------------------------------------------------------------
// Lightweight in-memory TTL cache for expensive aggregate queries.
// Avoids re-scanning large tables on every admin dashboard load.
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();
const PROFIT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getMemCache<T>(key: string): T | null {
    const entry = memCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        memCache.delete(key);
        return null;
    }
    return entry.data as T;
}

function setMemCache<T>(key: string, data: T, ttlMs: number): void {
    memCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface PaginationParams {
    page?: number;
    limit?: number;
}

interface DateRangeParams {
    startDate?: Date;
    endDate?: Date;
}

function resolvePagination(params?: PaginationParams): { page: number; limit: number; skip: number; take: number } {
    const pageRaw = Number(params?.page ?? 1);
    const limitRaw = Number(params?.limit ?? DEFAULT_LIMIT);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : 1;
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitRaw) ? Math.trunc(limitRaw) : DEFAULT_LIMIT));
    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
}

// ============================================================================
// TYPES
// ============================================================================

export type ProductModerationStatusType = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserStatusType = 'PENDING' | 'ACTIVE' | 'SUSPENDED';
export type OrderStatusType = 'PLACED' | 'CONFIRMED' | 'CANCELLED' | 'SHIPPED' | 'DELIVERED';

export interface AdminSeller {
    id: string;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    createdAt: Date;
}

export interface AdminProduct {
    id: string;
    title: string;
    description?: string | null;
    images?: string[];
    sellerId: string;
    sellerName?: string | null;
    sellerPhone?: string | null;
    sellerEmail: string | null;
    categoryId: string;
    categoryName: string | null;
    sellerPrice?: number;
    adminListingPrice?: number | null;
    priceApprovedAt?: Date | null;
    priceApprovedById?: string | null;
    status: ProductModerationStatusType;
    rejectionReason?: string | null;
    approvedAt?: Date | null;
    approvedById?: string | null;
    variants?: Array<{
        id: string;
        sku: string;
        price: number;
        compareAtPrice: number | null;
        stock: number;
    }>;
    isPublished: boolean;
    deletedByAdmin: boolean;
    deletedByAdminAt: Date | null;
    deletedByAdminReason: string | null;
    createdAt: Date;
    moderation: {
        status: string;
        reason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    } | null;
    occasionIds?: string[];
}

export interface AdminOrder {
    id: string;
    userId: string;
    buyerEmail?: string | null;
    buyerPhone?: string | null;
    status: string;
    totalAmount: number;
    shippingName?: string | null;
    shippingPhone?: string | null;
    shippingEmail?: string | null;
    shippingAddressLine1?: string | null;
    shippingAddressLine2?: string | null;
    shippingCity?: string | null;
    shippingPincode?: string | null;
    shippingNotes?: string | null;
    createdAt: Date;
    items: {
        id: string;
        sellerId: string;
        sellerEmail?: string | null;
        sellerName?: string | null;
        productId: string;
        productTitle?: string | null;
        variantId: string;
        variantSku?: string | null;
        quantity: number;
        priceSnapshot: number;
        sellerPriceSnapshot?: number;
        adminPriceSnapshot?: number;
        platformMargin?: number;
    }[];
}

export interface AdminPricingOverviewItem {
    productId: string;
    title: string;
    sellerId: string;
    sellerName: string | null;
    sellerEmail: string | null;
    sellerPrice: number;
    adminListingPrice: number | null;
    margin: number | null;
    marginPercentage: number | null;
    status: ProductModerationStatusType;
    image: string | null;
    updatedAt: Date;
}

export interface AdminProfitAnalytics {
    totalPlatformRevenue: number;
    totalSellerPayout: number;
    totalMarginEarned: number;
    profitPerProduct: Array<{
        productId: string;
        title: string;
        margin: number;
        soldUnits: number;
    }>;
    profitPerSeller: Array<{
        sellerId: string;
        sellerEmail: string | null;
        sellerName: string | null;
        margin: number;
        soldUnits: number;
    }>;
}

export interface AdminPayment {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    providerPaymentId: string | null;
    createdAt: Date;
}

export interface AdminSettlement {
    id: string;
    orderId: string;
    sellerId: string;
    grossAmount: number;
    commissionAmount: number;
    platformFee: number;
    netAmount: number;
    status: string;
    settledAt: Date | null;
    createdAt: Date;
}

/**
 * Admin Repository Class
 * Handles all admin-related database queries
 */
export class AdminRepository {
    // =========================================================================
    // DASHBOARD STATS (lightweight counts)
    // =========================================================================

    /**
     * Get aggregate counts for admin dashboard — uses COUNT instead of fetching all rows.
     */
    async getStats(): Promise<{
        sellers: number;
        products: number;
        orders: number;
        payments: number;
    }> {
        const [sellers, products, orders, payments] = await Promise.all([
            prisma.user.count({ where: { role: 'SELLER' } }),
            prisma.product.count(),
            prisma.order.count(),
            prisma.payment.count(),
        ]);
        return { sellers, products, orders, payments };
    }

    /**
     * Get recent sellers (last 5)
     */
    async findRecentSellers(limit = 5): Promise<AdminSeller[]> {
        return prisma.user.findMany({
            where: { role: 'SELLER' },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get recent products (last 5)
     */
    async findRecentProducts(limit = 5): Promise<AdminProduct[]> {
        const products = await prisma.product.findMany({
            include: {
                seller: {
                    select: {
                        email: true,
                        phone: true,
                        seller_profiles: { select: { store_name: true } },
                    },
                },
                category: { select: { name: true } },
                occasions: {
                    select: {
                        occasionId: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return products.map((product) => ({
            id: product.id,
            title: product.title,
            description: product.description,
            images: product.images,
            sellerId: product.sellerId,
            sellerName: product.seller?.seller_profiles?.store_name ?? null,
            sellerPhone: product.seller?.phone ?? null,
            sellerEmail: product.seller?.email ?? null,
            categoryId: product.categoryId,
            categoryName: product.category?.name ?? null,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice: product.adminListingPrice == null ? null : Number(product.adminListingPrice),
            priceApprovedAt: product.priceApprovedAt,
            priceApprovedById: product.priceApprovedById,
            status: product.status,
            rejectionReason: product.rejectionReason,
            approvedAt: product.approvedAt,
            approvedById: product.approvedById,
            isPublished: product.isPublished,
            deletedByAdmin: product.deletedByAdmin,
            deletedByAdminAt: product.deletedByAdminAt,
            deletedByAdminReason: product.deletedByAdminReason,
            createdAt: product.createdAt,
            moderation: {
                status: product.status,
                reason: product.rejectionReason,
                reviewedBy: product.approvedById,
                reviewedAt: product.approvedAt,
            },
            occasionIds: (product.occasions ?? []).map((item: { occasionId: string }) => item.occasionId),
        }));
    }

    // =========================================================================
    // SELLER MANAGEMENT
    // =========================================================================

    /**
     * Find all sellers
     */
    async findAllSellers(params?: PaginationParams): Promise<AdminSeller[]> {
        const { skip, take } = resolvePagination(params);
        const sellers = await prisma.user.findMany({
            where: { role: 'SELLER' },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });
        return sellers;
    }

    /**
     * Find seller by ID
     */
    async findSellerById(id: string): Promise<AdminSeller | null> {
        return prisma.user.findFirst({
            where: { id, role: 'SELLER' },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
    }

    /**
     * Update seller status
     */
    async updateSellerStatus(id: string, status: UserStatusType): Promise<AdminSeller> {
        return prisma.user.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
    }

    // =========================================================================
    // PRODUCT MODERATION
    // =========================================================================

    /**
     * Find all products pending moderation
     */
    async findPendingProducts(params?: PaginationParams): Promise<AdminProduct[]> {
        const { skip, take } = resolvePagination(params);
        const products = await prisma.product.findMany({
            where: { status: 'PENDING', deletedByAdmin: false },
            include: {
                seller: {
                    select: {
                        email: true,
                        phone: true,
                        seller_profiles: {
                            select: {
                                store_name: true,
                            },
                        },
                    },
                },
                category: { select: { name: true } },
                occasions: {
                    select: {
                        occasionId: true,
                    },
                },
                variants: {
                    include: { inventory: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });

        return products.map((product) => ({
            id: product.id,
            title: product.title,
            description: product.description,
            images: product.images,
            sellerId: product.sellerId,
            sellerName: product.seller?.seller_profiles?.store_name ?? null,
            sellerPhone: product.seller?.phone ?? null,
            sellerEmail: product.seller?.email ?? null,
            categoryId: product.categoryId,
            categoryName: product.category?.name ?? null,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice: product.adminListingPrice == null ? null : Number(product.adminListingPrice),
            priceApprovedAt: product.priceApprovedAt,
            priceApprovedById: product.priceApprovedById,
            status: product.status,
            rejectionReason: product.rejectionReason,
            approvedAt: product.approvedAt,
            approvedById: product.approvedById,
            variants: product.variants.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                price: variant.price,
                compareAtPrice: variant.compareAtPrice,
                stock: variant.inventory?.stock ?? 0,
            })),
            isPublished: product.isPublished,
            deletedByAdmin: product.deletedByAdmin,
            deletedByAdminAt: product.deletedByAdminAt,
            deletedByAdminReason: product.deletedByAdminReason,
            createdAt: product.createdAt,
            moderation: {
                status: product.status,
                reason: product.rejectionReason,
                reviewedBy: product.approvedById,
                reviewedAt: product.approvedAt,
            },
        }));
    }

    /**
     * Find product by ID with moderation info
     */
    async findProductById(id: string): Promise<AdminProduct | null> {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                seller: {
                    select: {
                        email: true,
                        phone: true,
                        seller_profiles: {
                            select: {
                                store_name: true,
                            },
                        },
                    },
                },
                category: { select: { name: true } },
                occasions: {
                    select: {
                        occasionId: true,
                    },
                },
                variants: {
                    include: { inventory: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!product) return null;

        return {
            id: product.id,
            title: product.title,
            description: product.description,
            images: product.images,
            sellerId: product.sellerId,
            sellerName: product.seller?.seller_profiles?.store_name ?? null,
            sellerPhone: product.seller?.phone ?? null,
            sellerEmail: product.seller?.email ?? null,
            categoryId: product.categoryId,
            categoryName: product.category?.name ?? null,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice: product.adminListingPrice == null ? null : Number(product.adminListingPrice),
            priceApprovedAt: product.priceApprovedAt,
            priceApprovedById: product.priceApprovedById,
            status: product.status,
            rejectionReason: product.rejectionReason,
            approvedAt: product.approvedAt,
            approvedById: product.approvedById,
            variants: product.variants.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                price: variant.price,
                compareAtPrice: variant.compareAtPrice,
                stock: variant.inventory?.stock ?? 0,
            })),
            isPublished: product.isPublished,
            deletedByAdmin: product.deletedByAdmin,
            deletedByAdminAt: product.deletedByAdminAt,
            deletedByAdminReason: product.deletedByAdminReason,
            createdAt: product.createdAt,
            moderation: {
                status: product.status,
                reason: product.rejectionReason,
                reviewedBy: product.approvedById,
                reviewedAt: product.approvedAt,
            },
            occasionIds: (product.occasions ?? []).map((item: { occasionId: string }) => item.occasionId),
        };
    }

    /**
     * List all products for admin view
     */
    async findAllProducts(params?: PaginationParams): Promise<AdminProduct[]> {
        const { skip, take } = resolvePagination(params);
        const products = await prisma.product.findMany({
            include: {
                seller: {
                    select: {
                        email: true,
                        phone: true,
                        seller_profiles: {
                            select: {
                                store_name: true,
                            },
                        },
                    },
                },
                category: { select: { name: true } },
                occasions: {
                    select: {
                        occasionId: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });

        return products.map((product) => ({
            id: product.id,
            title: product.title,
            description: product.description,
            images: product.images,
            sellerId: product.sellerId,
            sellerName: product.seller?.seller_profiles?.store_name ?? null,
            sellerPhone: product.seller?.phone ?? null,
            sellerEmail: product.seller?.email ?? null,
            categoryId: product.categoryId,
            categoryName: product.category?.name ?? null,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice: product.adminListingPrice == null ? null : Number(product.adminListingPrice),
            priceApprovedAt: product.priceApprovedAt,
            priceApprovedById: product.priceApprovedById,
            status: product.status,
            rejectionReason: product.rejectionReason,
            approvedAt: product.approvedAt,
            approvedById: product.approvedById,
            isPublished: product.isPublished,
            deletedByAdmin: product.deletedByAdmin,
            deletedByAdminAt: product.deletedByAdminAt,
            deletedByAdminReason: product.deletedByAdminReason,
            createdAt: product.createdAt,
            moderation: {
                status: product.status,
                reason: product.rejectionReason,
                reviewedBy: product.approvedById,
                reviewedAt: product.approvedAt,
            },
            occasionIds: (product.occasions ?? []).map((item: { occasionId: string }) => item.occasionId),
        }));
    }

    /**
     * Soft-delete a product by admin
     */
    async markProductDeletedByAdmin(
        id: string,
        reason?: string
    ): Promise<AdminProduct> {
        const product = await prisma.product.update({
            where: { id },
            data: {
                isPublished: false,
                status: 'REJECTED',
                rejectionReason: reason ?? 'Deleted by admin',
                deletedByAdmin: true,
                deletedByAdminAt: new Date(),
                deletedByAdminReason: reason ?? 'Deleted by admin',
            },
        });

        return {
            id: product.id,
            title: product.title,
            sellerId: product.sellerId,
            sellerEmail: null,
            categoryId: product.categoryId,
            categoryName: null,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice: product.adminListingPrice == null ? null : Number(product.adminListingPrice),
            priceApprovedAt: product.priceApprovedAt,
            priceApprovedById: product.priceApprovedById,
            status: product.status,
            rejectionReason: product.rejectionReason,
            approvedAt: product.approvedAt,
            approvedById: product.approvedById,
            isPublished: product.isPublished,
            deletedByAdmin: product.deletedByAdmin,
            deletedByAdminAt: product.deletedByAdminAt,
            deletedByAdminReason: product.deletedByAdminReason,
            createdAt: product.createdAt,
            moderation: {
                status: product.status,
                reason: product.rejectionReason,
                reviewedBy: product.approvedById,
                reviewedAt: product.approvedAt,
            },
        };
    }

    /**
     * Update product moderation status
     */
    async updateProductModeration(
        productId: string,
        status: ProductModerationStatusType,
        reviewedBy: string,
        reason?: string
    ): Promise<void> {
        await prisma.productModeration.upsert({
            where: { productId },
            update: {
                status,
                reason: reason ?? null,
                reviewedBy,
                reviewedAt: new Date(),
                updated_at: new Date(),
            },
            create: {
                productId,
                status,
                reason: reason ?? null,
                reviewedBy,
                reviewedAt: new Date(),
                updated_at: new Date(),
            },
        });
    }

    /**
     * Update product publish status
     */
    async updateProductPublishStatus(id: string, isPublished: boolean): Promise<AdminProduct> {
        const product = await prisma.product.update({
            where: { id },
            data: {
                isPublished,
                status: isPublished ? 'APPROVED' : 'REJECTED',
                ...(isPublished
                    ? { rejectionReason: null }
                    : {}),
            },
        });

        return {
            id: product.id,
            title: product.title,
            sellerId: product.sellerId,
            sellerEmail: null,
            categoryId: product.categoryId,
            categoryName: null,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice: product.adminListingPrice == null ? null : Number(product.adminListingPrice),
            priceApprovedAt: product.priceApprovedAt,
            priceApprovedById: product.priceApprovedById,
            status: product.status,
            rejectionReason: product.rejectionReason,
            approvedAt: product.approvedAt,
            approvedById: product.approvedById,
            isPublished: product.isPublished,
            deletedByAdmin: product.deletedByAdmin,
            deletedByAdminAt: product.deletedByAdminAt,
            deletedByAdminReason: product.deletedByAdminReason,
            createdAt: product.createdAt,
            moderation: {
                status: product.status,
                reason: product.rejectionReason,
                reviewedBy: product.approvedById,
                reviewedAt: product.approvedAt,
            },
        };
    }

    async applyProductApprovalDecision(
        productId: string,
        actorId: string,
        decision: 'APPROVED' | 'REJECTED',
        reason?: string
    ): Promise<AdminProduct> {
        const approved = decision === 'APPROVED';
        const product = await prisma.product.update({
            where: { id: productId },
            data: {
                status: decision,
                isPublished: approved,
                rejectionReason: approved ? null : reason ?? null,
                approvedAt: approved ? new Date() : null,
                approvedById: actorId,
            },
        });

        return {
            id: product.id,
            title: product.title,
            sellerId: product.sellerId,
            sellerEmail: null,
            categoryId: product.categoryId,
            categoryName: null,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice: product.adminListingPrice == null ? null : Number(product.adminListingPrice),
            priceApprovedAt: product.priceApprovedAt,
            priceApprovedById: product.priceApprovedById,
            status: product.status,
            rejectionReason: product.rejectionReason,
            approvedAt: product.approvedAt,
            approvedById: product.approvedById,
            isPublished: product.isPublished,
            deletedByAdmin: product.deletedByAdmin,
            deletedByAdminAt: product.deletedByAdminAt,
            deletedByAdminReason: product.deletedByAdminReason,
            createdAt: product.createdAt,
            moderation: {
                status: product.status,
                reason: product.rejectionReason,
                reviewedBy: product.approvedById,
                reviewedAt: product.approvedAt,
            },
        };
    }

    async setProductListingPrice(
        productId: string,
        adminListingPrice: number,
        actorId: string
    ): Promise<AdminProduct> {
        const product = await prisma.product.update({
            where: { id: productId },
            data: {
                adminListingPrice,
                priceApprovedAt: new Date(),
                priceApprovedById: actorId,
            },
        });

        return {
            id: product.id,
            title: product.title,
            sellerId: product.sellerId,
            sellerEmail: null,
            categoryId: product.categoryId,
            categoryName: null,
            sellerPrice: Number(product.sellerPrice),
            adminListingPrice: product.adminListingPrice == null ? null : Number(product.adminListingPrice),
            priceApprovedAt: product.priceApprovedAt,
            priceApprovedById: product.priceApprovedById,
            status: product.status,
            rejectionReason: product.rejectionReason,
            approvedAt: product.approvedAt,
            approvedById: product.approvedById,
            isPublished: product.isPublished,
            deletedByAdmin: product.deletedByAdmin,
            deletedByAdminAt: product.deletedByAdminAt,
            deletedByAdminReason: product.deletedByAdminReason,
            createdAt: product.createdAt,
            moderation: {
                status: product.status,
                reason: product.rejectionReason,
                reviewedBy: product.approvedById,
                reviewedAt: product.approvedAt,
            },
        };
    }

    async findProductPricingOverview(params?: PaginationParams): Promise<AdminPricingOverviewItem[]> {
        const { skip, take } = resolvePagination(params);
        const products = await prisma.product.findMany({
            where: { deletedByAdmin: false },
            include: {
                seller: {
                    select: {
                        email: true,
                        seller_profiles: {
                            select: {
                                store_name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take,
        });

        return products.map((product) => {
            const sellerPrice = Number(product.sellerPrice);
            const adminPrice = product.adminListingPrice == null ? null : Number(product.adminListingPrice);
            const margin = adminPrice == null ? null : adminPrice - sellerPrice;
            const marginPercentage =
                margin == null || sellerPrice <= 0 ? null : (margin / sellerPrice) * 100;

            return {
                productId: product.id,
                title: product.title,
                sellerId: product.sellerId,
                sellerName: product.seller?.seller_profiles?.store_name ?? null,
                sellerEmail: product.seller?.email ?? null,
                sellerPrice,
                adminListingPrice: adminPrice,
                margin,
                marginPercentage,
                status: product.status,
                image: product.images?.[0] ?? null,
                updatedAt: product.updatedAt,
            };
        });
    }

    async getProfitAnalytics(params?: DateRangeParams & { limit?: number }): Promise<AdminProfitAnalytics> {
        const cached = getMemCache<AdminProfitAnalytics>('profit_analytics');
        if (cached) return cached;

        const whereDateClause =
            params?.startDate || params?.endDate
                ? ` AND o."created_at" BETWEEN $1::timestamp AND $2::timestamp`
                : '';
        const queryParams: unknown[] =
            params?.startDate || params?.endDate
                ? [params.startDate ?? new Date('1970-01-01T00:00:00Z'), params.endDate ?? new Date()]
                : [];
        const limit = Math.min(MAX_LIMIT, Math.max(1, Math.trunc(params?.limit ?? DEFAULT_LIMIT)));

        const [totalsRows, productRows, sellerRows] = await Promise.all([
            prisma.$queryRawUnsafe<Array<{
                totalPlatformRevenue: unknown;
                totalSellerPayout: unknown;
                totalMarginEarned: unknown;
            }>>(
                `SELECT
                    COALESCE(SUM(COALESCE(oi."admin_price_snapshot", oi."price_snapshot") * oi."quantity"), 0) AS "totalPlatformRevenue",
                    COALESCE(SUM(COALESCE(oi."seller_price_snapshot", oi."price_snapshot") * oi."quantity"), 0) AS "totalSellerPayout",
                    COALESCE(SUM(COALESCE(oi."platform_margin", COALESCE(oi."admin_price_snapshot", oi."price_snapshot") - COALESCE(oi."seller_price_snapshot", oi."price_snapshot")) * oi."quantity"), 0) AS "totalMarginEarned"
                 FROM "order_items" oi
                 INNER JOIN "orders" o ON o."id" = oi."order_id"
                 WHERE o."status" IN ('CONFIRMED', 'SHIPPED', 'DELIVERED')${whereDateClause}`,
                ...queryParams,
            ),
            prisma.$queryRawUnsafe<Array<{ productId: string; title: string; margin: unknown; soldUnits: unknown }>>(
                `SELECT
                    oi."product_id" AS "productId",
                    COALESCE(p."title", 'Untitled product') AS "title",
                    COALESCE(SUM(COALESCE(oi."platform_margin", COALESCE(oi."admin_price_snapshot", oi."price_snapshot") - COALESCE(oi."seller_price_snapshot", oi."price_snapshot")) * oi."quantity"), 0) AS "margin",
                    COALESCE(SUM(oi."quantity"), 0) AS "soldUnits"
                 FROM "order_items" oi
                 INNER JOIN "orders" o ON o."id" = oi."order_id"
                 LEFT JOIN "products" p ON p."id" = oi."product_id"
                 WHERE o."status" IN ('CONFIRMED', 'SHIPPED', 'DELIVERED')${whereDateClause}
                 GROUP BY oi."product_id", p."title"
                 ORDER BY "margin" DESC
                 LIMIT ${limit}`,
                ...queryParams,
            ),
            prisma.$queryRawUnsafe<Array<{ sellerId: string; margin: unknown; soldUnits: unknown }>>(
                `SELECT
                    oi."seller_id" AS "sellerId",
                    COALESCE(SUM(COALESCE(oi."platform_margin", COALESCE(oi."admin_price_snapshot", oi."price_snapshot") - COALESCE(oi."seller_price_snapshot", oi."price_snapshot")) * oi."quantity"), 0) AS "margin",
                    COALESCE(SUM(oi."quantity"), 0) AS "soldUnits"
                 FROM "order_items" oi
                 INNER JOIN "orders" o ON o."id" = oi."order_id"
                 WHERE o."status" IN ('CONFIRMED', 'SHIPPED', 'DELIVERED')${whereDateClause}
                 GROUP BY oi."seller_id"
                 ORDER BY "margin" DESC
                 LIMIT ${limit}`,
                ...queryParams,
            ),
        ]);

        const totals = totalsRows[0] ?? {
            totalPlatformRevenue: 0,
            totalSellerPayout: 0,
            totalMarginEarned: 0,
        };

        const sellerIds = sellerRows.map((row) => row.sellerId);
        const sellers = sellerIds.length
            ? await prisma.user.findMany({
                where: { id: { in: sellerIds } },
                select: {
                    id: true,
                    email: true,
                    seller_profiles: {
                        select: {
                            store_name: true,
                        },
                    },
                },
            })
            : [];
        const sellerLookup = new Map(sellers.map((seller) => [seller.id, seller]));

        const result = {
            totalPlatformRevenue: Number(totals.totalPlatformRevenue ?? 0),
            totalSellerPayout: Number(totals.totalSellerPayout ?? 0),
            totalMarginEarned: Number(totals.totalMarginEarned ?? 0),
            profitPerProduct: productRows.map((row) => ({
                productId: row.productId,
                title: row.title,
                margin: Number(row.margin ?? 0),
                soldUnits: Number(row.soldUnits ?? 0),
            })),
            profitPerSeller: sellerRows.map((row) => {
                const seller = sellerLookup.get(row.sellerId);
                return {
                    sellerId: row.sellerId,
                    sellerEmail: seller?.email ?? null,
                    sellerName: seller?.seller_profiles?.store_name ?? null,
                    margin: Number(row.margin ?? 0),
                    soldUnits: Number(row.soldUnits ?? 0),
                };
            }),
        };

        setMemCache('profit_analytics', result, PROFIT_CACHE_TTL_MS);
        return result;
    }

    // =========================================================================
    // ORDER MANAGEMENT
    // =========================================================================

    /**
     * Find all orders
     */
    async findAllOrders(params?: PaginationParams & DateRangeParams): Promise<AdminOrder[]> {
        const { skip, take } = resolvePagination(params);
        const createdAtFilter =
            params?.startDate || params?.endDate
                ? {
                    ...(params.startDate ? { gte: params.startDate } : {}),
                    ...(params.endDate ? { lte: params.endDate } : {}),
                }
                : undefined;

        const orders = await prisma.order.findMany({
            where: {
                ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
            },
            select: {
                id: true,
                userId: true,
                status: true,
                totalAmount: true,
                shippingName: true,
                shippingPhone: true,
                shippingEmail: true,
                shippingAddressLine1: true,
                shippingAddressLine2: true,
                shippingCity: true,
                shippingPincode: true,
                shippingNotes: true,
                createdAt: true,
                items: {
                    select: {
                        id: true,
                        sellerId: true,
                        productId: true,
                        variantId: true,
                        quantity: true,
                        priceSnapshot: true,
                        sellerPriceSnapshot: true,
                        adminPriceSnapshot: true,
                        platformMargin: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });

        return this.enrichOrders(orders);
    }

    /**
     * Find order by ID
     */
    async findOrderById(id: string): Promise<AdminOrder | null> {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });

        if (!order) return null;

        const enriched = await this.enrichOrders([order]);
        return enriched[0] ?? null;
    }

    /**
     * Update order status
     */
    async updateOrderStatus(id: string, status: OrderStatusType): Promise<AdminOrder> {
        const order = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                items: true,
            },
        });

        const enriched = await this.enrichOrders([order]);
        return enriched[0] as AdminOrder;
    }

    private async enrichOrders(
        orders: Array<{
            id: string;
            userId: string;
            status: string;
            totalAmount: number;
            shippingName: string | null;
            shippingPhone: string | null;
            shippingEmail: string | null;
            shippingAddressLine1: string | null;
            shippingAddressLine2: string | null;
            shippingCity: string | null;
            shippingPincode: string | null;
            shippingNotes: string | null;
            createdAt: Date;
            items: Array<{
                id: string;
                sellerId: string;
                productId: string;
                variantId: string;
                quantity: number;
                priceSnapshot: number;
                sellerPriceSnapshot: number;
                adminPriceSnapshot: number;
                platformMargin: number;
            }>;
        }>
    ): Promise<AdminOrder[]> {
        if (orders.length === 0) return [];

        const userIds = [...new Set(orders.map((order) => order.userId))];
        const allItems = orders.flatMap((order) => order.items);
        const sellerIds = [...new Set(allItems.map((item) => item.sellerId))];
        const productIds = [...new Set(allItems.map((item) => item.productId))];
        const variantIds = [...new Set(allItems.map((item) => item.variantId))];

        const [buyers, sellers, products, variants] = await Promise.all([
            userIds.length
                ? prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true, email: true, phone: true },
                })
                : [],
            sellerIds.length
                ? prisma.user.findMany({
                    where: { id: { in: sellerIds } },
                    select: {
                        id: true,
                        email: true,
                        seller_profiles: {
                            select: { store_name: true },
                        },
                    },
                })
                : [],
            productIds.length
                ? prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, title: true },
                })
                : [],
            variantIds.length
                ? prisma.productVariant.findMany({
                    where: { id: { in: variantIds } },
                    select: { id: true, sku: true },
                })
                : [],
        ]);

        const buyerMap = new Map(buyers.map((user) => [user.id, user]));
        const sellerMap = new Map(sellers.map((seller) => [seller.id, seller]));
        const productMap = new Map(products.map((product) => [product.id, product]));
        const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

        return orders.map((order) => ({
            id: order.id,
            userId: order.userId,
            buyerEmail: buyerMap.get(order.userId)?.email ?? null,
            buyerPhone: buyerMap.get(order.userId)?.phone ?? null,
            status: order.status,
            totalAmount: order.totalAmount,
            shippingName: order.shippingName,
            shippingPhone: order.shippingPhone,
            shippingEmail: order.shippingEmail,
            shippingAddressLine1: order.shippingAddressLine1,
            shippingAddressLine2: order.shippingAddressLine2,
            shippingCity: order.shippingCity,
            shippingPincode: order.shippingPincode,
            shippingNotes: order.shippingNotes,
            createdAt: order.createdAt,
            items: order.items.map((item) => ({
                id: item.id,
                sellerId: item.sellerId,
                sellerEmail: sellerMap.get(item.sellerId)?.email ?? null,
                sellerName: sellerMap.get(item.sellerId)?.seller_profiles?.store_name ?? null,
                productId: item.productId,
                productTitle: productMap.get(item.productId)?.title ?? null,
                variantId: item.variantId,
                variantSku: variantMap.get(item.variantId)?.sku ?? null,
                quantity: item.quantity,
                priceSnapshot: item.priceSnapshot,
                sellerPriceSnapshot: item.sellerPriceSnapshot,
                adminPriceSnapshot: item.adminPriceSnapshot,
                platformMargin: item.platformMargin,
            })),
        }));
    }

    // =========================================================================
    // PAYMENTS & SETTLEMENTS
    // =========================================================================

    /**
     * Find all payments
     */
    async findAllPayments(params?: PaginationParams): Promise<AdminPayment[]> {
        const { skip, take } = resolvePagination(params);
        const payments = await prisma.payment.findMany({
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            select: {
                id: true,
                orderId: true,
                userId: true,
                amount: true,
                currency: true,
                status: true,
                provider: true,
                providerPaymentId: true,
                createdAt: true,
            },
        });

        return payments.map((p) => ({
            id: p.id,
            orderId: p.orderId,
            userId: p.userId,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            provider: p.provider,
            providerPaymentId: p.providerPaymentId,
            createdAt: p.createdAt,
        }));
    }

    /**
     * Find all settlements
     */
    async findAllSettlements(params?: PaginationParams): Promise<AdminSettlement[]> {
        const { skip, take } = resolvePagination(params);
        const settlements = await prisma.sellerSettlement.findMany({
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });

        return settlements.map((s) => ({
            id: s.id,
            orderId: s.orderId,
            sellerId: s.sellerId,
            grossAmount: s.grossAmount,
            commissionAmount: s.commissionAmount,
            platformFee: s.platformFee,
            netAmount: s.netAmount,
            status: s.status,
            settledAt: s.settledAt,
            createdAt: s.createdAt,
        }));
    }
}

// Export singleton instance
export const adminRepository = new AdminRepository();
