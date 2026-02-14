import { prisma } from '../config/db.js';
import { CartRepository, cartRepository } from '../repositories/cart.repository.js';
import {
    invalidateCache,
    CACHE_KEYS,
} from '../utils/cache.util.js';
import { notificationService } from '../notifications/notification.service.js';
import { ApiError } from '../errors/ApiError.js';
import type { CheckoutResponse } from '../types/order.types.js';

/**
 * Checkout Service
 * Handles the checkout process with inventory management
 * 
 * Note: Uses sequential operations instead of interactive transactions
 * due to Neon connection pooler limitations with Prisma transactions.
 */
export class CheckoutService {
    constructor(private readonly cartRepo: CartRepository) { }

    /**
     * Process checkout
     * 1. Validate inventory for all items
     * 2. Create order with items
     * 3. Deduct stock and create movements
     * 4. Clear cart
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
        // 1. Get cart with all items and details
        const cart = await this.cartRepo.getCartWithDetails(userId);
        if (!cart || cart.items.length === 0) {
            throw ApiError.badRequest('Cart is empty');
        }

        // 2. Validate all items have sufficient stock
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
            availableStock: number;
        }> = [];

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
                    availableStock,
                });
            }
        }

        if (validationErrors.length > 0) {
            throw ApiError.badRequest(validationErrors.join('; '));
        }

        // 3. Calculate total amount
        const subtotal = itemsWithStock.reduce(
            (sum, item) => sum + item.priceSnapshot * item.quantity,
            0
        );
        const shippingFee = itemsWithStock.length > 0 ? 180 : 0;
        const totalAmount = subtotal + shippingFee;

        // 4. Create order with items (single create with nested writes)
        const order = await prisma.order.create({
            data: {
                userId,
                totalAmount,
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
                    })),
                },
            },
            include: { items: true },
        });

        // 5. Deduct inventory and create RESERVE movements for each item
        for (const item of itemsWithStock) {
            // Deduct stock
            await prisma.inventory.update({
                where: { variantId: item.variantId },
                data: { stock: { decrement: item.quantity } },
            });

            // Create reserve movement
            await prisma.inventoryMovement.create({
                data: {
                    variantId: item.variantId,
                    orderId: order.id,
                    quantity: item.quantity,
                    type: 'RESERVE',
                },
            });
        }

        // 6. Clear cart
        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        // 7. Invalidate caches
        await Promise.all([
            invalidateCache(CACHE_KEYS.CART(userId)),
            invalidateCache(CACHE_KEYS.BUYER_ORDERS(userId)),
            // Also invalidate product caches since stock changed
            ...itemsWithStock.map((item) =>
                invalidateCache(CACHE_KEYS.PRODUCT_DETAIL(item.productId))
            ),
            invalidateCache(CACHE_KEYS.PRODUCTS_LIST),
        ]);

        // 8. Trigger Notifications
        // Notify Buyer
        await notificationService.notifyOrderPlaced(userId, order.id, totalAmount);

        // Notify Sellers
        const itemsBySeller = itemsWithStock.reduce((acc, item) => {
            acc[item.sellerId] = (acc[item.sellerId] || 0) + 1; // Count unique items per seller
            return acc;
        }, {} as Record<string, number>);


        for (const [sellerId, count] of Object.entries(itemsBySeller)) {
            await notificationService.notifySellerNewOrder(sellerId, order.id, count);
        }

        // Notify Buyer
        await notificationService.notifyOrderPlaced(order.userId, order.id, Number(order.totalAmount));

        return {
            message: 'Order placed successfully',
            order: {
                id: order.id,
                userId: order.userId,
                status: order.status,
                totalAmount: order.totalAmount,
                createdAt: order.createdAt,
            },
        };
    }
}

// Export singleton instance
export const checkoutService = new CheckoutService(cartRepository);
