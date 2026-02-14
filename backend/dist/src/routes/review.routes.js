import { Router } from 'express';
import { reviewController } from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
const reviewRouter = Router();
// POST /v1/reviews/product/:productId - Create a review (Protected, User only)
reviewRouter.post('/product/:productId', authenticate, reviewController.createReview);
// GET /v1/reviews/product/:productId - Get reviews (Public)
reviewRouter.get('/product/:productId', reviewController.getProductReviews);
export { reviewRouter };
//# sourceMappingURL=review.routes.js.map