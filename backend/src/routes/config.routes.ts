/**
 * Public Config Routes
 *
 * Unauthenticated, read-only platform configuration consumed by the
 * storefront and mobile checkout to render accurate cost estimates
 * (e.g. whether the shipping charge currently applies).
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { settingsService, DEFAULT_SHIPPING_FEE_INR } from '../services/settings.service.js';

export const configRouter = Router();

/**
 * GET /v1/config/shipping
 * Current shipping-charge configuration for display in cart/checkout.
 */
configRouter.get('/shipping', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const enabled = await settingsService.isShippingChargeEnabled();
        res.json({ enabled, amount: enabled ? DEFAULT_SHIPPING_FEE_INR : 0 });
    } catch (error) {
        next(error);
    }
});
