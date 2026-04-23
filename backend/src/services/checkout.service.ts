import { prisma } from '../config/db.js';
import { CartRepository, cartRepository } from '../repositories/cart.repository.js';
import {
    invalidateCache,
    invalidateCacheByPattern,
    CACHE_KEYS,
} from '../utils/cache.util.js';
import { emitOrderPlaced } from '../events/order.events.js';
import { ApiError } from '../errors/ApiError.js';
import type { CheckoutResponse } from '../types/order.types.js';
import { checkoutLogger, inventoryLogger } from '../config/logger.js';
import {
    inventoryReserveAttemptTotal,
    checkoutSuccessTotal,
    checkoutFailTotal,
    gstCalculationTotal,
    igstAppliedTotal,
    intraStateOrderTotal,
} from '../config/metrics.js';
import { recordReserveAttempt, recordReserveFailure } from '../monitoring/alerts.js';
import { couponService } from './coupon.service.js';
import { Prisma } from '@prisma/client';
import { dispatchFreshness } from '../live/freshness.service.js';
import { CACHE_TAGS, orderTag, productTag } from '../live/cache-tags.js';

const round2 = (value: Prisma.Decimal) => value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
const MAX_CHECKOUT_ITEMS = 20;

/**
 * Checkout Service
 * Handles the checkout process with atomic inventory reservation.
 *
 * Concurrency strategy:
 *   1. Validate cart items and pricing outside the transaction (read-only).
 *   2. Inside a serialised $transaction:
 *      a. Atomically decrement stock using `updateMany WHERE stock >= qty`.
 *         If ANY row returns count=0 → rollback entire transaction (no partial reservation).
 *      b. Create order + items in the same tx.
 *      c. Create RESERVE movements for audit trail.
 *      d. Clear cart.
 *   3. Cache invalidation + notifications happen outside the tx (best-effort).
 *
 * This guarantees:
 *   - Two users cannot buy the last unit simultaneously.
 *   - Stock can never go negative at the database level.
 *   - No partial reservations — all-or-nothing.
 */
export class CheckoutService {
    constructor(private readonly cartRepo: CartRepository) { }

    /**
     * Process checkout — atomic, concurrency-safe
     */
    async checkout(
        userId: string,
        shipping?: {
            shippingName?: string;
            shippingPhone?: string;
            shippingEmail?: string;
            shippingAddressLine1?: string;
            shippingAddressLine2?: string;
            shippingCity?: string;
            shippingPincode?: string;
            shippingNotes?: string;
        },
        couponCode?: string,
    ): Promise<CheckoutResponse> {
        // =====================================================================
        // PHASE 1 — Read-only validation (outside transaction)
        // =====================================================================

        const [cart, buyer] = await Promise.all([
            this.cartRepo.getCartWithDetails(userId),
            prisma.user.findUnique({
                where: { id: userId },
                select: { state: true },
            }),
        ]);
        if (!cart || cart.items.length === 0) {
            throw ApiError.badRequest('Cart is empty');
        }

        if (cart.items.length > MAX_CHECKOUT_ITEMS) {
            throw ApiError.badRequest(`Cart cannot contain more than ${MAX_CHECKOUT_ITEMS} items per checkout`);
        }

        const validationErrors: string[] = [];
        const itemsWithStock: Array<{
            variantId: string;
            productId: string;
            sellerId: string;
            quantity: number;
            priceSnapshot: number;
            sellerPriceSnapshot: number;
            adminPriceSnapshot: number;
            platformMargin: number;
            taxRate: number;
            sellerState: string;
            buyerState: string;
            lineSubtotal: Prisma.Decimal;
        }> = [];

        const buyerState = buyer?.state ?? '';

        const productIds = cart.items.map((i) => i.productId);
        const sellerIds = [
            ...new Set(
                cart.items
                    .map((i) => i.product?.sellerId)
                    .filter((sellerId): sellerId is string => Boolean(sellerId))
            ),
        ];

        const [productTaxRates, sellerProfiles] = await Promise.all([
            prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, taxRate: true },
            }),
            prisma.seller_profiles.findMany({
                where: { user_id: { in: sellerIds } },
                select: { user_id: true, state: true },
            }),
        ]);

        const variants = await prisma.productVariant.findMany({
            where: { id: { in: [...new Set(cart.items.map((item) => item.variantId))] } },
            select: {
                id: true,
                sellerPrice: true,
                adminListingPrice: true,
                price: true,
                status: true,
            },
        });

        const taxRateMap = new Map(
            productTaxRates.map((p) => [p.id, p.taxRate ?? 0])
        );

        const sellerStateMap = new Map(
            sellerProfiles.map((s) => [s.user_id, s.state ?? ''])
        );

        const variantMap = new Map(
            variants.map((variant) => [
                variant.id,
                {
                    sellerPrice: Number(variant.sellerPrice),
                    adminListingPrice:
                        variant.adminListingPrice == null ? null : Number(variant.adminListingPrice),
                    price: Number(variant.price),
                    status: variant.status,
                },
            ])
        );

        for (const item of cart.items) {
            const availableStock = item.variant?.inventory?.stock ?? 0;

            if (!item.product || !item.variant) {
                validationErrors.push(`Product or variant not found for item ${item.id}`);
                continue;
            }

            const variantPricing = variantMap.get(item.variantId);
            if (!variantPricing) {
                validationErrors.push(`Pricing could not be resolved for ${item.product.title}`);
                continue;
            }

            if (variantPricing.status !== 'APPROVED') {
                validationErrors.push(`Selected variant is pending approval for ${item.product.title}`);
                continue;
            }

            const adminListingPrice = variantPricing.price;
            const sellerPrice = variantPricing.sellerPrice;
            const margin = adminListingPrice - sellerPrice;

            if (margin < 0) {
                validationErrors.push(`Invalid pricing state for ${item.product.title}`);
                continue;
            }

            const productTaxRate = taxRateMap.get(item.productId) ?? 0;
            const sellerState = sellerStateMap.get(item.product.sellerId) ?? '';

            if (item.quantity > availableStock) {
                validationErrors.push(
                    `Insufficient stock for ${item.product.title}: Available ${availableStock}, Requested ${item.quantity}`
                );
            } else {
                itemsWithStock.push({
                    variantId: item.variantId,
                    productId: item.productId,
                    sellerId: item.product.sellerId,
                    quantity: item.quantity,
                    priceSnapshot: adminListingPrice,
                    sellerPriceSnapshot: sellerPrice,
                    adminPriceSnapshot: adminListingPrice,
                    platformMargin: margin,
                    taxRate: productTaxRate,
                    sellerState,
                    buyerState,
                    lineSubtotal: new Prisma.Decimal(adminListingPrice).mul(item.quantity),
                });
            }
        }

        if (validationErrors.length > 0) {
            throw ApiError.badRequest(validationErrors.join('; '));
        }

        // Calculate pre-tax subtotal only. GST is calculated after coupon discount allocation.
        const orderSubtotal = itemsWithStock.reduce(
            (sum, item) => sum.add(item.lineSubtotal),
            new Prisma.Decimal(0),
        );
        const shippingFee = itemsWithStock.length > 0 ? 180 : 0;

        // =====================================================================
        // PHASE 2 — Atomic transaction: reserve stock + create order + clear cart
        // =====================================================================

        checkoutLogger.info({ event: 'checkout_attempt', userId, itemCount: itemsWithStock.length }, 'Checkout attempt started');

        const order = await prisma.$transaction(async (tx) => {
            // 2a. Atomic stock reservation — decrement only if sufficient stock
            //     Uses updateMany with WHERE stock >= qty. If count === 0 the
            //     variant ran out of stock between validation and this point.
            //     We fail the ENTIRE checkout on the first insufficient item
            //     (all-or-nothing — no partial reservations).
            for (const item of itemsWithStock) {
                recordReserveAttempt();
                inventoryReserveAttemptTotal.inc({ variantId: item.variantId });

                const result = await tx.inventory.updateMany({
                    where: {
                        variantId: item.variantId,
                        stock: { gte: item.quantity },
                    },
                    data: {
                        stock: { decrement: item.quantity },
                    },
                });

                if (result.count === 0) {
                    // Another checkout claimed this stock — throw to rollback tx
                    recordReserveFailure(item.variantId);
                    checkoutFailTotal.inc({ reason: 'out_of_stock' });
                    inventoryLogger.warn({
                        event: 'inventory_reserve_failed',
                        userId,
                        variantId: item.variantId,
                        qty: item.quantity,
                    }, `Reserve failed for variant ${item.variantId}`);
                    throw new ApiError(
                        409,
                        `Insufficient stock for variant ${item.variantId}. Please refresh and try again.`
                    );
                }

                inventoryLogger.info({
                    event: 'inventory_reserve_success',
                    userId,
                    variantId: item.variantId,
                    qty: item.quantity,
                }, `Reserved ${item.quantity} units of variant ${item.variantId}`);
            }

            const uniqueSellerIds = Array.from(new Set(itemsWithStock.map((item) => item.sellerId)));

            let appliedCoupon: {
                couponId: string;
                couponCode: string;
                discountAmount: Prisma.Decimal;
            } | null = null;

            if (couponCode && couponCode.trim().length > 0) {
                appliedCoupon = await couponService.applyCouponToOrder({
                    userId,
                    couponCode,
                    orderSubtotal,
                    sellerIds: uniqueSellerIds,
                    tx,
                });
            }

            const totalDiscount = appliedCoupon?.discountAmount ?? new Prisma.Decimal(0);

            let allocatedDiscount = new Prisma.Decimal(0);
            const discountedLines = itemsWithStock.map((item, index) => {
                const isLast = index === itemsWithStock.length - 1;

                let itemDiscount = new Prisma.Decimal(0);
                if (totalDiscount.gt(0)) {
                    if (isLast) {
                        itemDiscount = totalDiscount.sub(allocatedDiscount);
                    } else {
                        itemDiscount = round2(
                            totalDiscount.mul(item.lineSubtotal).div(orderSubtotal),
                        );
                        allocatedDiscount = allocatedDiscount.add(itemDiscount);
                    }

                    if (itemDiscount.gt(item.lineSubtotal)) {
                        itemDiscount = item.lineSubtotal;
                    }
                }

                const discountedTaxable = round2(item.lineSubtotal.sub(itemDiscount));
                const taxRate = new Prisma.Decimal(item.taxRate);
                const taxAmount = round2(discountedTaxable.mul(taxRate).div(100));

                const intraState =
                    !item.buyerState || item.sellerState.toLowerCase().trim() === item.buyerState.toLowerCase().trim();

                let cgst = new Prisma.Decimal(0);
                let sgst = new Prisma.Decimal(0);
                let igst = new Prisma.Decimal(0);

                if (taxAmount.gt(0)) {
                    if (intraState) {
                        cgst = round2(taxAmount.div(2));
                        sgst = round2(taxAmount.sub(cgst));
                    } else {
                        igst = taxAmount;
                    }
                }

                gstCalculationTotal.inc();
                if (igst.gt(0)) {
                    igstAppliedTotal.inc();
                } else if (cgst.gt(0) || sgst.gt(0)) {
                    intraStateOrderTotal.inc();
                }

                const lineTotal = round2(discountedTaxable.add(cgst).add(sgst).add(igst));

                return {
                    ...item,
                    discountedTaxable,
                    itemDiscount,
                    cgst,
                    sgst,
                    igst,
                    lineTotal,
                };
            });

            const totalQty = itemsWithStock.reduce((sum, item) => sum + item.quantity, 0);
            const flatGstFee = new Prisma.Decimal(180).mul(totalQty);
            const orderSubTotal = round2(
                discountedLines.reduce((sum, item) => sum.add(item.discountedTaxable), new Prisma.Decimal(0)),
            );
            const orderTaxTotal = round2(
                discountedLines.reduce((sum, item) => sum.add(item.cgst).add(item.sgst).add(item.igst), new Prisma.Decimal(0)),
            );
            const orderGrandTotal = round2(
                discountedLines.reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0)),
            );
            const orderTaxTotalWithFlat = round2(orderTaxTotal.add(flatGstFee));
            const orderGrandTotalWithFlat = round2(orderGrandTotal.add(flatGstFee));
            const grandTotalWithShipping = round2(orderGrandTotalWithFlat.add(shippingFee));
            const totalAmount = grandTotalWithShipping;

            // 2b. Create order with items
            const created = await tx.order.create({
                data: {
                    userId,
                    totalAmount: Number(totalAmount.toString()),
                    subTotalAmount: Number(orderSubTotal.toString()),
                    totalTaxAmount: Number(orderTaxTotalWithFlat.toString()),
                    grandTotal: Number(grandTotalWithShipping.toString()),
                    couponCode: appliedCoupon?.couponCode ?? null,
                    discountAmount: totalDiscount,
                    shippingName: shipping?.shippingName ?? null,
                    shippingPhone: shipping?.shippingPhone ?? null,
                    shippingEmail: shipping?.shippingEmail ?? null,
                    shippingAddressLine1: shipping?.shippingAddressLine1 ?? null,
                    shippingAddressLine2: shipping?.shippingAddressLine2 ?? null,
                    shippingCity: shipping?.shippingCity ?? null,
                    shippingPincode: shipping?.shippingPincode ?? null,
                    shippingNotes: shipping?.shippingNotes ?? null,
                    status: 'PLACED',
                    items: {
                        create: discountedLines.map((item) => ({
                            sellerId: item.sellerId,
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            priceSnapshot: item.priceSnapshot,
                            sellerPriceSnapshot: item.sellerPriceSnapshot,
                            adminPriceSnapshot: item.adminPriceSnapshot,
                            platformMargin: item.platformMargin,
                            taxRate: item.taxRate,
                            taxableAmount: Number(item.discountedTaxable.toString()),
                            cgstAmount: Number(item.cgst.toString()),
                            sgstAmount: Number(item.sgst.toString()),
                            igstAmount: Number(item.igst.toString()),
                            totalAmount: Number(item.lineTotal.toString()),
                        })),
                    },
                },
                include: { items: true },
            });

            if (appliedCoupon && totalDiscount.gt(0)) {
                await couponService.redeemCouponAfterOrderCreated({
                    tx,
                    couponId: appliedCoupon.couponId,
                    userId,
                    orderId: created.id,
                    discountAmount: totalDiscount,
                });
            }

            // 2c. Create RESERVE inventory movements (audit trail)
            await tx.inventoryMovement.createMany({
                data: itemsWithStock.map((item) => ({
                    variantId: item.variantId,
                    orderId: created.id,
                    quantity: item.quantity,
                    type: 'RESERVE',
                    reason: 'CHECKOUT',
                })),
            });

            // 2d. Clear cart
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return created;
        }, {
            maxWait: 20000,
            timeout: 20000,
        });

        // =====================================================================
        // PHASE 3 — Post-transaction side effects (best-effort)
        // =====================================================================

        // Invalidate caches
        const productIdsToInvalidate = Array.from(new Set(itemsWithStock.map((item) => item.productId)));

        // Keep buyer cart immediately consistent for UX; run broader invalidations asynchronously.
        await invalidateCache(CACHE_KEYS.CART(userId));

        void Promise.allSettled([
            invalidateCacheByPattern(`${CACHE_KEYS.BUYER_ORDERS(userId)}:*`),
            invalidateCacheByPattern(`orders:detail:*`),
            invalidateCacheByPattern(`recommendations:${userId}`),
            ...productIdsToInvalidate.map((productId) =>
                invalidateCache(CACHE_KEYS.PRODUCT_DETAIL(productId))
            ),
            invalidateCache(CACHE_KEYS.PRODUCTS_LIST),
            invalidateCacheByPattern('products:list:*'),
            invalidateCacheByPattern('search:*'),
        ]).catch((error) => {
            checkoutLogger.warn({ userId, orderId: order.id, error }, 'Async cache invalidation failed');
        });

        // Trigger Notifications (event-driven, idempotent, best-effort)
        void emitOrderPlaced(order.id).catch((error) => {
            checkoutLogger.error({ orderId: order.id, error }, 'Failed to emit order placed event');
        });

        void dispatchFreshness({
            type: 'order.updated',
            entityId: order.id,
            tags: [
                CACHE_TAGS.orders,
                CACHE_TAGS.userOrders,
                CACHE_TAGS.sellerOrders,
                CACHE_TAGS.products,
                CACHE_TAGS.search,
                orderTag(order.id),
                ...productIdsToInvalidate.map((productId) => productTag(productId)),
            ],
            audience: { allAuthenticated: true },
        }).catch((error) => {
            checkoutLogger.warn({ orderId: order.id, error }, 'checkout_freshness_dispatch_failed');
        });

        checkoutSuccessTotal.inc();
        checkoutLogger.info({
            event: 'checkout_success',
            userId,
            orderId: order.id,
            totalAmount: order.totalAmount,
            itemCount: itemsWithStock.length,
            couponCode: order.couponCode,
            discountAmount: order.discountAmount,
        }, `Checkout succeeded — order ${order.id}`);

        // Structured GST log
        const hasIntraState = order.items.some((i) => i.cgstAmount > 0 || i.sgstAmount > 0);
        checkoutLogger.info({
            event: 'gst_calculated',
            orderId: order.id,
            intraState: hasIntraState,
            totalTax: order.totalTaxAmount,
            subTotal: order.subTotalAmount,
            grandTotal: order.grandTotal,
            discountAmount: order.discountAmount,
        }, `GST calculated for order ${order.id}`);

        return {
            message: 'Order placed successfully',
            order: {
                id: order.id,
                userId: order.userId,
                status: order.status,
                totalAmount: order.totalAmount,
                subTotalAmount: order.subTotalAmount,
                totalTaxAmount: order.totalTaxAmount,
                grandTotal: order.grandTotal,
                couponCode: order.couponCode,
                discountAmount: Number(order.discountAmount),
                createdAt: order.createdAt,
            },
        };
    }
}

// Export singleton instance
export const checkoutService = new CheckoutService(cartRepository);
