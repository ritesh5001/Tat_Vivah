import { checkoutService } from '../services/checkout.service.js';
/**
 * Checkout Controller
 *
 * Payment gateways have been removed. Checkout now only places the order
 * (reserves inventory, creates the order in PLACED status). Payment will be
 * re-attached here once a new gateway is integrated.
 */
export class CheckoutController {
    async checkout(req, res, next) {
        try {
            const userId = req.user.userId;
            const { couponCode, ...shipping } = req.body ?? {};
            const result = await checkoutService.checkout(userId, shipping, couponCode);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
export const checkoutController = new CheckoutController();
//# sourceMappingURL=checkout.controller.js.map