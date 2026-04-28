import { Router } from 'express';
import { reviewController } from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
const reviewRouter = Router();
// POST /v1/reviews/:id/helpful - Mark as helpful (Authenticated)
reviewRouter.post('/:id/helpful', authenticate, reviewController.markHelpful);
// GET /v1/reviews/product/:productId - Get reviews (Public) — legacy route
reviewRouter.get('/product/:productId', reviewController.getProductReviews);
export { reviewRouter };
//# sourceMappingURL=review.routes.js.map