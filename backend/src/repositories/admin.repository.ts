/**
 * Admin Repository
 * Database operations for admin panel
 */

import { prisma } from '../config/db.js';

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
}

export interface AdminOrder {
    id: string;
    userId: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
    items: {
        id: string;
        sellerId: string;
        productId: string;
        variantId: string;
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
    sellerId: string;
    orderItemId: string;
    amount: number;
    status: string;
    createdAt: Date;
}

/**
 * Admin Repository Class
 * Handles all admin-related database queries
 */
export class AdminRepository {
    // =========================================================================
    // SELLER MANAGEMENT
    // =========================================================================

    /**
     * Find all sellers
     */
    async findAllSellers(): Promise<AdminSeller[]> {
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
    async findPendingProducts(): Promise<AdminProduct[]> {
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
                variants: {
                    include: { inventory: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
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
        };
    }

    /**
     * List all products for admin view
     */
    async findAllProducts(): Promise<AdminProduct[]> {
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
            },
            orderBy: { createdAt: 'desc' },
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

    async findProductPricingOverview(): Promise<AdminPricingOverviewItem[]> {
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

    async getProfitAnalytics(): Promise<AdminProfitAnalytics> {
        const items = await prisma.orderItem.findMany({
            where: {
                order: {
                    status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] },
                },
            },
        });

        const uniqueProductIds = [...new Set(items.map((item) => item.productId))];
        const products = uniqueProductIds.length
            ? await prisma.product.findMany({
                where: { id: { in: uniqueProductIds } },
                select: {
                    id: true,
                    title: true,
                },
            })
            : [];
        const productLookup = new Map(products.map((product) => [product.id, product.title]));

        const sellerMap = new Map<string, { margin: number; soldUnits: number }>();
        const productMap = new Map<string, { title: string; margin: number; soldUnits: number }>();

        let totalPlatformRevenue = 0;
        let totalSellerPayout = 0;
        let totalMarginEarned = 0;

        for (const item of items) {
            const qty = item.quantity;
            const adminPrice = item.adminPriceSnapshot ?? item.priceSnapshot;
            const sellerPrice = item.sellerPriceSnapshot ?? item.priceSnapshot;
            const marginPerUnit = item.platformMargin ?? (adminPrice - sellerPrice);

            totalPlatformRevenue += adminPrice * qty;
            totalSellerPayout += sellerPrice * qty;
            totalMarginEarned += marginPerUnit * qty;

            const sellerEntry = sellerMap.get(item.sellerId) ?? { margin: 0, soldUnits: 0 };
            sellerEntry.margin += marginPerUnit * qty;
            sellerEntry.soldUnits += qty;
            sellerMap.set(item.sellerId, sellerEntry);

            const productEntry =
                productMap.get(item.productId) ?? {
                    title: productLookup.get(item.productId) ?? 'Untitled product',
                    margin: 0,
                    soldUnits: 0,
                };
            productEntry.margin += marginPerUnit * qty;
            productEntry.soldUnits += qty;
            productMap.set(item.productId, productEntry);
        }

        const sellerIds = Array.from(sellerMap.keys());
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

        return {
            totalPlatformRevenue,
            totalSellerPayout,
            totalMarginEarned,
            profitPerProduct: Array.from(productMap.entries()).map(([productId, value]) => ({
                productId,
                title: value.title,
                margin: value.margin,
                soldUnits: value.soldUnits,
            })),
            profitPerSeller: Array.from(sellerMap.entries()).map(([sellerId, value]) => {
                const seller = sellerLookup.get(sellerId);
                return {
                    sellerId,
                    sellerEmail: seller?.email ?? null,
                    sellerName: seller?.seller_profiles?.store_name ?? null,
                    margin: value.margin,
                    soldUnits: value.soldUnits,
                };
            }),
        };
    }

    // =========================================================================
    // ORDER MANAGEMENT
    // =========================================================================

    /**
     * Find all orders
     */
    async findAllOrders(): Promise<AdminOrder[]> {
        const orders = await prisma.order.findMany({
            include: {
                items: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return orders.map((order) => ({
            id: order.id,
            userId: order.userId,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            items: order.items.map((item) => ({
                id: item.id,
                sellerId: item.sellerId,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                priceSnapshot: item.priceSnapshot,
                sellerPriceSnapshot: item.sellerPriceSnapshot,
                adminPriceSnapshot: item.adminPriceSnapshot,
                platformMargin: item.platformMargin,
            })),
        }));
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

        return {
            id: order.id,
            userId: order.userId,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            items: order.items.map((item) => ({
                id: item.id,
                sellerId: item.sellerId,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                priceSnapshot: item.priceSnapshot,
                sellerPriceSnapshot: item.sellerPriceSnapshot,
                adminPriceSnapshot: item.adminPriceSnapshot,
                platformMargin: item.platformMargin,
            })),
        };
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

        return {
            id: order.id,
            userId: order.userId,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            items: order.items.map((item) => ({
                id: item.id,
                sellerId: item.sellerId,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                priceSnapshot: item.priceSnapshot,
                sellerPriceSnapshot: item.sellerPriceSnapshot,
                adminPriceSnapshot: item.adminPriceSnapshot,
                platformMargin: item.platformMargin,
            })),
        };
    }

    // =========================================================================
    // PAYMENTS & SETTLEMENTS
    // =========================================================================

    /**
     * Find all payments
     */
    async findAllPayments(): Promise<AdminPayment[]> {
        const payments = await prisma.payment.findMany({
            orderBy: { createdAt: 'desc' },
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
    async findAllSettlements(): Promise<AdminSettlement[]> {
        const settlements = await prisma.sellerSettlement.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return settlements.map((s) => ({
            id: s.id,
            sellerId: s.sellerId,
            orderItemId: s.orderItemId,
            amount: s.amount,
            status: s.status,
            createdAt: s.createdAt,
        }));
    }
}

// Export singleton instance
export const adminRepository = new AdminRepository();
