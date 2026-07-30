import type { Request, Response, NextFunction } from 'express';
/**
 * Checkout Controller
 *
 * Payment gateways have been removed. Checkout places the order and — since
 * there is no online payment step to confirm it — immediately confirms the
 * order (PLACED → CONFIRMED + invoice) so it is fulfillable and not
 * auto-cancelled by the stale-order sweep. Payment will be re-attached here
 * once a new gateway is integrated.
 */
export declare class CheckoutController {
    checkout(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const checkoutController: CheckoutController;
//# sourceMappingURL=checkout.controller.d.ts.map