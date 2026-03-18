import { Prisma, OrderStatus, RefundStatus, ReturnStatus, SettlementStatus } from '@prisma/client';
import { prisma } from '../config/db.js';
import { getFromCache, setCache } from '../utils/cache.util.js';

/**
 * Seller Analytics Service
 *
 * Provides aggregated analytics data for seller dashboards:
 *   - Summary KPIs (revenue, orders, refunds, rates)
 *   - Revenue over time (daily / weekly / monthly)
 *   - Top products by units sold
 *   - Inventory health (low stock, out of stock, fast movers)
 *   - Refund impact (total refunds, most-returned products)
 *
 * All heavy queries are cached in Redis for 5 minutes.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

const CACHE_TTL = 300; // 5 minutes

function dateCacheSegment(d?: Date): string {
    return d ? d.toISOString() : '_';
}

// ---------------------------------------------------------------------------
// Response types (exported for controller / OpenAPI re-use)
// ---------------------------------------------------------------------------

export interface AnalyticsSummary {
    totalRevenue: number;
    totalOrders: number;
    totalUnitsSold: number;
    averageOrderValue: number;
    totalRefundAmount: number;
    netRevenue: number;
    returnRate: number;
    cancellationRate: number;
    conversionRate: number;
}

export interface ChartPoint {
    date: string;
    revenue: number;
}

export interface TopProduct {
    productId: string;
    title: string;
    image: string | null;
    unitsSold: number;
    revenue: number;
    returnCount: number;
    ratingAverage: number;
}

export interface InventoryHealth {
    lowStockProducts: number;
    outOfStockProducts: number;
    totalVariants: number;
    fastMovingProducts: Array<{
        productId: string;
        title: string;
        image: string | null;
        unitsSold: number;
    }>;
}

export interface RefundImpactData {
    totalRefunds: number;
    refundRevenueImpact: number;
    mostReturnedProducts: Array<{
        productId: string;
        title: string;
        returnCount: number;
        refundAmount: number;
    }>;
}

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

class SellerAnalyticsService {
    // ── 1. Dashboard Summary ─────────────────────────────────────────────
    async getSummary(
        sellerId: string,
        startDate?: Date,
        endDate?: Date,
    ): Promise<AnalyticsSummary> {
        const cacheKey = `seller:analytics:summary:${sellerId}:${dateCacheSegment(startDate)}:${dateCacheSegment(endDate)}`;
        const cached = await getFromCache<AnalyticsSummary>(cacheKey);
        if (cached) return cached;

        // Build optional date filter for related order
        const createdAtFilter: Record<string, Date> = {};
        if (startDate) createdAtFilter.gte = startDate;
        if (endDate) createdAtFilter.lte = endDate;
        const hasDate = Object.keys(createdAtFilter).length > 0;

        // Exclude cancelled orders from revenue / units / order-count
        const activeStatusFilter = {
            order: {
                status: { notIn: [OrderStatus.CANCELLED] as OrderStatus[] },
                ...(hasDate ? { createdAt: createdAtFilter } : {}),
            },
        };

        // ── Batch 1: aggregates ──────────────────────────────────────────
        const [settlementAgg, orderItemAgg, distinctOrders] = await Promise.all([
            prisma.sellerSettlement.aggregate({
                where: {
                    sellerId,
                    status: { not: SettlementStatus.CANCELLED },
                    ...activeStatusFilter,
                },
                _sum: { grossAmount: true, netAmount: true },
            }),
            prisma.orderItem.aggregate({
                where: { sellerId, ...activeStatusFilter },
                _sum: { quantity: true },
            }),
            prisma.orderItem.findMany({
                where: { sellerId, ...activeStatusFilter },
                select: { orderId: true },
                distinct: ['orderId'],
            }),
        ]);

        const orderIds = distinctOrders.map((o) => o.orderId);
        const totalOrders = orderIds.length;
        const totalRevenue = settlementAgg._sum.grossAmount ?? 0;
        const netRevenue = settlementAgg._sum.netAmount ?? 0;
        const unitsSold = orderItemAgg._sum.quantity ?? 0;
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        if (totalOrders === 0) {
            const empty: AnalyticsSummary = {
                totalRevenue: 0,
                totalOrders: 0,
                totalUnitsSold: 0,
                averageOrderValue: 0,
                totalRefundAmount: 0,
                netRevenue: 0,
                returnRate: 0,
                cancellationRate: 0,
                conversionRate: 0,
            };
            await setCache(cacheKey, empty, CACHE_TTL);
            return empty;
        }

        // ── Batch 2: refunds, statuses, returns ─────────────────────────
        const [refundAgg, orders, returnCount] = await Promise.all([
            prisma.refund.aggregate({
                where: { orderId: { in: orderIds }, status: RefundStatus.SUCCESS },
                _sum: { amount: true },
            }),
            prisma.order.findMany({
                where: { id: { in: orderIds } },
                select: { status: true },
            }),
            prisma.returnRequest.count({
                where: {
                    orderId: { in: orderIds },
                    status: { in: [ReturnStatus.APPROVED, ReturnStatus.REFUNDED] },
                },
            }),
        ]);

        const refundAmountRupees = (refundAgg._sum.amount ?? 0) / 100;
        const delivered = orders.filter((o) => o.status === OrderStatus.DELIVERED).length;
        const cancelled = orders.filter((o) => o.status === OrderStatus.CANCELLED).length;
        const returnRate = delivered > 0 ? (returnCount / delivered) * 100 : 0;
        const cancellationRate = totalOrders > 0 ? (cancelled / totalOrders) * 100 : 0;

        const result: AnalyticsSummary = {
            totalRevenue: round2(totalRevenue),
            totalOrders,
            totalUnitsSold: unitsSold,
            averageOrderValue: round2(aov),
            totalRefundAmount: round2(refundAmountRupees),
            netRevenue: round2(netRevenue),
            returnRate: round2(returnRate),
            cancellationRate: round2(cancellationRate),
            conversionRate: 0, // no tracking table available
        };
        await setCache(cacheKey, result, CACHE_TTL);
        return result;
    }

    // ── 2. Revenue Over Time ─────────────────────────────────────────────
    async getRevenueChart(
        sellerId: string,
        interval: 'daily' | 'weekly' | 'monthly',
    ): Promise<ChartPoint[]> {
        const cacheKey = `seller:analytics:chart:${sellerId}:${interval}`;
        const cached = await getFromCache<ChartPoint[]>(cacheKey);
        if (cached) return cached;

        // Raw SQL group expression — interval is validated by Zod enum
        let truncExpr: string;
        switch (interval) {
            case 'daily':
                truncExpr = "DATE(o.created_at)";
                break;
            case 'weekly':
                truncExpr = "DATE_TRUNC('week', o.created_at)::date";
                break;
            case 'monthly':
                truncExpr = "DATE_TRUNC('month', o.created_at)::date";
                break;
        }

        type Row = { date: Date | string; revenue: number };

        const rows = await prisma.$queryRawUnsafe<Row[]>(
            `SELECT ${truncExpr} AS date,
                    COALESCE(SUM(ss.gross_amount), 0)::float AS revenue
             FROM seller_settlements ss
             JOIN orders o ON ss.order_id = o.id
             WHERE ss.seller_id = $1
               AND o.status IN ('CONFIRMED', 'DELIVERED')
               AND ss.status != 'CANCELLED'
             GROUP BY 1
             ORDER BY 1 ASC`,
            sellerId,
        );

        const result: ChartPoint[] = rows.map((r) => ({
            date: r.date instanceof Date ? r.date.toISOString().split('T')[0]! : String(r.date),
            revenue: Number(r.revenue),
        }));

        await setCache(cacheKey, result, CACHE_TTL);
        return result;
    }

    // ── 3. Top Products ──────────────────────────────────────────────────
    async getTopProducts(sellerId: string, limit = 10): Promise<TopProduct[]> {
        const cacheKey = `seller:analytics:top-products:${sellerId}:${limit}`;
        const cached = await getFromCache<TopProduct[]>(cacheKey);
        if (cached) return cached;

        const productAggs = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                sellerId,
                order: { status: { notIn: [OrderStatus.CANCELLED] } },
            },
            _sum: { quantity: true, totalAmount: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: limit,
        });

        if (productAggs.length === 0) {
            await setCache(cacheKey, [], CACHE_TTL);
            return [];
        }

        const productIds = productAggs.map((p) => p.productId);

        const [products, reviewAggs, returnCounts] = await Promise.all([
            prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, title: true, images: true },
            }),
            prisma.review.groupBy({
                by: ['productId'],
                where: { productId: { in: productIds } },
                _avg: { rating: true },
            }),
            prisma.$queryRaw<Array<{ productId: string; returnCount: bigint }>>`
                SELECT oi.product_id AS "productId",
                       COUNT(DISTINCT ri.return_request_id) AS "returnCount"
                FROM order_items oi
                JOIN return_items ri ON ri.order_item_id = oi.id
                WHERE oi.seller_id = ${sellerId}
                  AND oi.product_id IN (${Prisma.join(productIds)})
                GROUP BY oi.product_id
            `,
        ]);

        const prodMap = new Map(products.map((p) => [p.id, p]));
        const ratingMap = new Map(reviewAggs.map((r) => [r.productId, r._avg.rating ?? 0]));
        const returnMap = new Map(returnCounts.map((r) => [r.productId, Number(r.returnCount)]));

        const result: TopProduct[] = productAggs.map((agg) => {
            const p = prodMap.get(agg.productId);
            return {
                productId: agg.productId,
                title: p?.title ?? 'Unknown Product',
                image: p?.images?.[0] ?? null,
                unitsSold: agg._sum.quantity ?? 0,
                revenue: round2(agg._sum.totalAmount ?? 0),
                returnCount: returnMap.get(agg.productId) ?? 0,
                ratingAverage: round2(ratingMap.get(agg.productId) ?? 0),
            };
        });

        await setCache(cacheKey, result, CACHE_TTL);
        return result;
    }

    // ── 4. Inventory Health ──────────────────────────────────────────────
    async getInventoryHealth(sellerId: string): Promise<InventoryHealth> {
        const cacheKey = `seller:analytics:inventory:${sellerId}`;
        const cached = await getFromCache<InventoryHealth>(cacheKey);
        if (cached) return cached;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [variants, fastMovingAggs] = await Promise.all([
            prisma.productVariant.findMany({
                where: { product: { sellerId } },
                take: 5000,
                include: {
                    inventory: true,
                    product: { select: { id: true, title: true, images: true } },
                },
            }),
            prisma.orderItem.groupBy({
                by: ['productId'],
                where: {
                    sellerId,
                    order: {
                        createdAt: { gte: thirtyDaysAgo },
                        status: { notIn: [OrderStatus.CANCELLED] },
                    },
                },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10,
            }),
        ]);

        const totalVariants = variants.length;
        const lowStockSet = new Set<string>();
        const outOfStockSet = new Set<string>();

        for (const v of variants) {
            const stock = v.inventory?.stock ?? 0;
            if (stock === 0) outOfStockSet.add(v.productId);
            else if (stock < 10) lowStockSet.add(v.productId);
        }

        // Build fast mover detail map
        const fmProductIds = fastMovingAggs.map((f) => f.productId);
        const fmProducts =
            fmProductIds.length > 0
                ? await prisma.product.findMany({
                      where: { id: { in: fmProductIds } },
                      select: { id: true, title: true, images: true },
                  })
                : [];
        const fmMap = new Map(fmProducts.map((p) => [p.id, p]));

        const result: InventoryHealth = {
            lowStockProducts: lowStockSet.size,
            outOfStockProducts: outOfStockSet.size,
            totalVariants,
            fastMovingProducts: fastMovingAggs
                .filter((f) => (f._sum.quantity ?? 0) >= 5)
                .map((f) => ({
                    productId: f.productId,
                    title: fmMap.get(f.productId)?.title ?? 'Unknown',
                    image: fmMap.get(f.productId)?.images?.[0] ?? null,
                    unitsSold: f._sum.quantity ?? 0,
                })),
        };

        await setCache(cacheKey, result, CACHE_TTL);
        return result;
    }

    // ── 5. Refund Impact ─────────────────────────────────────────────────
    async getRefundImpact(
        sellerId: string,
        startDate?: Date,
        endDate?: Date,
    ): Promise<RefundImpactData> {
        const cacheKey = `seller:analytics:refund:${sellerId}:${dateCacheSegment(startDate)}:${dateCacheSegment(endDate)}`;
        const cached = await getFromCache<RefundImpactData>(cacheKey);
        if (cached) return cached;

        const createdAtFilter: Record<string, Date> = {};
        if (startDate) createdAtFilter.gte = startDate;
        if (endDate) createdAtFilter.lte = endDate;
        const hasDate = Object.keys(createdAtFilter).length > 0;
        const orderDateWhere = hasDate ? { order: { createdAt: createdAtFilter } } : {};
        const distinctOrders = await prisma.orderItem.findMany({
            where: { sellerId, ...orderDateWhere },
            select: { orderId: true },
            distinct: ['orderId'],
        });
        const orderIds = distinctOrders.map((o) => o.orderId);

        if (orderIds.length === 0) {
            const empty: RefundImpactData = { totalRefunds: 0, refundRevenueImpact: 0, mostReturnedProducts: [] };
            await setCache(cacheKey, empty, CACHE_TTL);
            return empty;
        }

        const [refundAgg, mostReturned] = await Promise.all([
            prisma.refund.aggregate({
                where: { orderId: { in: orderIds }, status: RefundStatus.SUCCESS },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.$queryRaw<
                Array<{ productId: string; title: string; returnCount: bigint; refundAmount: number }>
            >`
                SELECT oi.product_id  AS "productId",
                       p.title,
                       COUNT(DISTINCT ri.return_request_id)        AS "returnCount",
                       COALESCE(SUM(ri.quantity * oi.price_snapshot), 0)::float AS "refundAmount"
                FROM return_items ri
                JOIN order_items oi ON ri.order_item_id = oi.id
                JOIN products    p  ON oi.product_id    = p.id
                WHERE oi.seller_id = ${sellerId}
                  AND oi.order_id IN (${Prisma.join(orderIds)})
                GROUP BY oi.product_id, p.title
                ORDER BY "returnCount" DESC
                LIMIT 10
            `,
        ]);

        const result: RefundImpactData = {
            totalRefunds: refundAgg._count,
            refundRevenueImpact: round2((refundAgg._sum.amount ?? 0) / 100),
            mostReturnedProducts: mostReturned.map((r) => ({
                productId: r.productId,
                title: r.title,
                returnCount: Number(r.returnCount),
                refundAmount: round2(Number(r.refundAmount)),
            })),
        };

        await setCache(cacheKey, result, CACHE_TTL);
        return result;
    }
}

export const sellerAnalyticsService = new SellerAnalyticsService();
