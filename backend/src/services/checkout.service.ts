import { prisma } from '../config/db.js';
import { CartRepository, cartRepository } from '../repositories/cart.repository.js';
import {
    invalidateCache,
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
import { calculateGST, type GSTResult } from '../utils/gst.util.js';

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
            shippingNotes?: string;
        }
    ): Promise<CheckoutResponse> {
        // =====================================================================
        // PHASE 1 — Read-only validation (outside transaction)
        // =====================================================================

        const cart = await this.cartRepo.getCartWithDetails(userId);
        if (!cart || cart.items.length === 0) {
            throw ApiError.badRequest('Cart is empty');
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
            gst: GSTResult;
        }> = [];

        // Fetch buyer state for GST calculation
        const buyer = await prisma.user.findUnique({
            where: { id: userId },
            select: { state: true },
        });
        const buyerState = buyer?.state ?? '';

        for (const item of cart.items) {
            const availableStock = item.variant?.inventory?.stock ?? 0;

            if (!item.product || !item.variant) {
                validationErrors.push(`Product or variant not found for item ${item.id}`);
                continue;
            }

            const adminListingPriceRaw = (item.product as any).adminListingPrice;
            const sellerPriceRaw = (item.product as any).sellerPrice;

            if (adminListingPriceRaw === null || adminListingPriceRaw === undefined) {
                validationErrors.push(`Pricing is pending approval for ${item.product.title}`);
                continue;
            }

            const adminListingPrice = Number(adminListingPriceRaw);
            const sellerPrice = Number(sellerPriceRaw ?? adminListingPriceRaw);
            const margin = adminListingPrice - sellerPrice;

            if (margin < 0) {
                validationErrors.push(`Invalid pricing state for ${item.product.title}`);
                continue;
            }

            // Fetch product taxRate and seller state for GST
            const productWithTax = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { taxRate: true },
            });
            const sellerProfile = await prisma.seller_profiles.findUnique({
                where: { user_id: item.product.sellerId },
                select: { state: true },
            });
            const productTaxRate = productWithTax?.taxRate ?? 0;
            const sellerState = sellerProfile?.state ?? '';

            const gst = calculateGST({
                price: adminListingPrice,
                quantity: item.quantity,
                taxRate: productTaxRate,
                sellerState,
                buyerState,
            });

            gstCalculationTotal.inc();
            if (gst.igstAmount > 0) {
                igstAppliedTotal.inc();
            } else if (gst.cgstAmount > 0) {
                intraStateOrderTotal.inc();
            }

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
                    gst,
                });
            }
        }

        if (validationErrors.length > 0) {
            throw ApiError.badRequest(validationErrors.join('; '));
        }

        // Calculate totals (GST-aware)
        let orderSubTotal = 0;
        let orderTaxTotal = 0;
        let orderGrandTotal = 0;
        for (const item of itemsWithStock) {
            orderSubTotal += item.gst.taxableAmount;
            orderTaxTotal += item.gst.cgstAmount + item.gst.sgstAmount + item.gst.igstAmount;
            orderGrandTotal += item.gst.totalAmount;
        }
        const shippingFee = itemsWithStock.length > 0 ? 180 : 0;
        // grandTotal includes shipping; totalAmount kept for backward compat
        const grandTotalWithShipping = Math.round((orderGrandTotal + shippingFee) * 100) / 100;
        const totalAmount = grandTotalWithShipping;

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

            // 2b. Create order with items
            const created = await tx.order.create({
                data: {
                    userId,
                    totalAmount,
                    subTotalAmount: Math.round(orderSubTotal * 100) / 100,
                    totalTaxAmount: Math.round(orderTaxTotal * 100) / 100,
                    grandTotal: grandTotalWithShipping,
                    shippingName: shipping?.shippingName ?? null,
                    shippingPhone: shipping?.shippingPhone ?? null,
                    shippingEmail: shipping?.shippingEmail ?? null,
                    shippingAddressLine1: shipping?.shippingAddressLine1 ?? null,
                    shippingAddressLine2: shipping?.shippingAddressLine2 ?? null,
                    shippingCity: shipping?.shippingCity ?? null,
                    shippingNotes: shipping?.shippingNotes ?? null,
                    status: 'PLACED',
                    items: {
                        create: itemsWithStock.map((item) => ({
                            sellerId: item.sellerId,
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            priceSnapshot: item.priceSnapshot,
                            sellerPriceSnapshot: item.sellerPriceSnapshot,
                            adminPriceSnapshot: item.adminPriceSnapshot,
                            platformMargin: item.platformMargin,
                            taxRate: item.taxRate,
                            taxableAmount: item.gst.taxableAmount,
                            cgstAmount: item.gst.cgstAmount,
                            sgstAmount: item.gst.sgstAmount,
                            igstAmount: item.gst.igstAmount,
                            totalAmount: item.gst.totalAmount,
                        })),
                    },
                },
                include: { items: true },
            });

            // 2c. Create RESERVE inventory movements (audit trail)
            for (const item of itemsWithStock) {
                await tx.inventoryMovement.create({
                    data: {
                        variantId: item.variantId,
                        orderId: created.id,
                        quantity: item.quantity,
                        type: 'RESERVE',
                    },
                });
            }

            // 2d. Clear cart
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return created;
        });

        // =====================================================================
        // PHASE 3 — Post-transaction side effects (best-effort)
        // =====================================================================

        // Invalidate caches
        await Promise.all([
            invalidateCache(CACHE_KEYS.CART(userId)),
            invalidateCache(CACHE_KEYS.BUYER_ORDERS(userId)),
            ...itemsWithStock.map((item) =>
                invalidateCache(CACHE_KEYS.PRODUCT_DETAIL(item.productId))
            ),
            invalidateCache(CACHE_KEYS.PRODUCTS_LIST),
        ]);

        // Trigger Notifications (event-driven, idempotent, best-effort)
        await emitOrderPlaced(order.id);

        checkoutSuccessTotal.inc();
        checkoutLogger.info({
            event: 'checkout_success',
            userId,
            orderId: order.id,
            totalAmount,
            itemCount: itemsWithStock.length,
        }, `Checkout succeeded — order ${order.id}`);

        // Structured GST log
        const hasIntraState = itemsWithStock.some((i) => i.gst.cgstAmount > 0);
        checkoutLogger.info({
            event: 'gst_calculated',
            orderId: order.id,
            intraState: hasIntraState,
            totalTax: Math.round(orderTaxTotal * 100) / 100,
            subTotal: Math.round(orderSubTotal * 100) / 100,
            grandTotal: grandTotalWithShipping,
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
                createdAt: order.createdAt,
            },
        };
    }
}

// Export singleton instance
export const checkoutService = new CheckoutService(cartRepository);
