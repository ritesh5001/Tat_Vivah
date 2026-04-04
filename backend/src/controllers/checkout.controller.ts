import type { Request, Response, NextFunction } from 'express';
import { PaymentProvider } from '@prisma/client';
import { checkoutService } from '../services/checkout.service.js';
import { paymentService } from '../services/payment.service.js';

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
            const withPayment = req.query.withPayment === '1';
            if (!withPayment) {
                res.status(201).json(result);
                return;
            }

            try {
                const payment = await paymentService.initiatePayment(
                    userId,
                    result.order.id,
                    PaymentProvider.RAZORPAY,
                );

                res.status(201).json({
                    ...result,
                    payment,
                });
                return;
            } catch (paymentError) {
                // Order is already placed at this point; return order and let client fallback to explicit initiate endpoint.
                res.status(201).json({
                    ...result,
                    payment: null,
                    paymentInitError:
                        paymentError instanceof Error
                            ? paymentError.message
                            : 'Payment initialization failed',
                });
                return;
            }
        } catch (error) {
            next(error);
        }
    }
}
// Export singleton instance
export const checkoutController = new CheckoutController();
