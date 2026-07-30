import type { Request, Response, NextFunction } from 'express';
/**
 * Checkout Controller
 *
 * Payment gateways have been removed. Checkout now only places the order
 * (reserves inventory, creates the order in PLACED status). Payment will be
 * re-attached here once a new gateway is integrated.
 */
export declare class CheckoutController {
    checkout(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const checkoutController: CheckoutController;
//# sourceMappingURL=checkout.controller.d.ts.map