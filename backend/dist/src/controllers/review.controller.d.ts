/**
 * Review Controller
 * HTTP handlers for product reviews
 */
import type { Request, Response, NextFunction } from 'express';
export declare const reviewController: {
    /**
     * POST /v1/products/:id/reviews
     * Create a product review (USER only)
     */
    createReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/products/:id/reviews
     * Get product reviews (public, paginated)
     */
    getProductReviews: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /v1/reviews/:id/helpful
     * Mark a review as helpful (authenticated)
     */
    markHelpful: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PATCH /v1/admin/reviews/:id/hide
     * Hide/unhide a review (ADMIN only)
     */
    hideReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
//# sourceMappingURL=review.controller.d.ts.map