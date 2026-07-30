import { checkoutService } from '../services/checkout.service.js';
import { paymentService } from '../services/payment.service.js';
import { paymentLogger } from '../config/logger.js';
/**
 * Checkout Controller
 *
 * Payment gateways have been removed. Checkout places the order and — since
 * there is no online payment step to confirm it — immediately confirms the
 * order (PLACED → CONFIRMED + invoice) so it is fulfillable and not
 * auto-cancelled by the stale-order sweep. Payment will be re-attached here
 * once a new gateway is integrated.
 */
export class CheckoutController {
    async checkout(req, res, next) {
        try {
            const userId = req.user.userId;
            const { couponCode, ...shipping } = req.body ?? {};
            const result = await checkoutService.checkout(userId, shipping, couponCode);
            // Confirm the order (no payment gateway to do it). Best-effort:
            // a confirm failure must not fail the checkout — the order exists.
            let confirmed = false;
            try {
                await paymentService.confirmOrderWithoutPayment(result.order.id);
                confirmed = true;
            }
            catch (confirmError) {
                paymentLogger.error({
                    event: 'order_confirm_failed',
                    orderId: result.order.id,
                    error: confirmError instanceof Error ? confirmError.message : String(confirmError),
                }, 'Failed to confirm order after checkout');
            }
            res.status(201).json({
                ...result,
                order: { ...result.order, status: confirmed ? 'CONFIRMED' : result.order.status },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export const checkoutController = new CheckoutController();
//# sourceMappingURL=checkout.controller.js.map