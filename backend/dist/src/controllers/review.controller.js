/**
 * Review Controller
 * HTTP handlers for product reviews
 */
import { reviewService } from '../services/review.service.js';
import { createReviewSchema, reviewQuerySchema, hideReviewSchema } from '../validators/review.validation.js';
export const reviewController = {
    /**
     * POST /v1/products/:id/reviews
     * Create a product review (USER only)
     */
    createReview: async (req, res, next) => {
        try {
            const productId = req.params['id'];
            const userId = req.user.userId;
            const validated = createReviewSchema.parse(req.body);
            const review = await reviewService.createReview(productId, userId, validated);
            res.status(201).json({ message: 'Review submitted', review });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * GET /v1/products/:id/reviews
     * Get product reviews (public, paginated)
     */
    getProductReviews: async (req, res, next) => {
        try {
            const productId = req.params['id'];
            const query = reviewQuerySchema.parse(req.query);
            const result = await reviewService.getProductReviews(productId, query);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * POST /v1/reviews/:id/helpful
     * Mark a review as helpful (authenticated)
     */
    markHelpful: async (req, res, next) => {
        try {
            const reviewId = req.params['id'];
            const result = await reviewService.markHelpful(reviewId);
            res.json({ message: 'Marked as helpful', helpfulCount: result.helpfulCount });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * PATCH /v1/admin/reviews/:id/hide
     * Hide/unhide a review (ADMIN only)
     */
    hideReview: async (req, res, next) => {
        try {
            const reviewId = req.params['id'];
            const { isHidden } = hideReviewSchema.parse(req.body);
            const review = await reviewService.setHidden(reviewId, isHidden);
            const action = isHidden ? 'hidden' : 'unhidden';
            res.json({ message: `Review ${action}`, review });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=review.controller.js.map