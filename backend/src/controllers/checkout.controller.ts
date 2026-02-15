import type { Request, Response, NextFunction } from 'express';
import { checkoutService } from '../services/checkout.service.js';

/**
 * Checkout Controller
 * Handles HTTP requests for checkout operations
 */
export class CheckoutController {
    /**
     * Process checkout
     * POST /v1/checkout
     */
    async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const { couponCode, ...shipping } = req.body ?? {};
            const result = await checkoutService.checkout(userId, shipping, couponCode);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const checkoutController = new CheckoutController();
