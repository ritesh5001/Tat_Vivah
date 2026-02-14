import { CartRepository } from '../repositories/cart.repository.js';
import type { CheckoutResponse } from '../types/order.types.js';
/**
 * Checkout Service
 * Handles the checkout process with inventory management
 *
 * Note: Uses sequential operations instead of interactive transactions
 * due to Neon connection pooler limitations with Prisma transactions.
 */
export declare class CheckoutService {
    private readonly cartRepo;
    constructor(cartRepo: CartRepository);
    /**
     * Process checkout
     * 1. Validate inventory for all items
     * 2. Create order with items
     * 3. Deduct stock and create movements
     * 4. Clear cart
     */
    checkout(userId: string, shipping?: {
        shippingName?: string;
        shippingPhone?: string;
        shippingEmail?: string;
        shippingAddressLine1?: string;
        shippingAddressLine2?: string;
        shippingCity?: string;
        shippingNotes?: string;
    }): Promise<CheckoutResponse>;
}
export declare const checkoutService: CheckoutService;
//# sourceMappingURL=checkout.service.d.ts.map