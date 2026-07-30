import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
// Payment gateways removed — only read access to a payment record remains.
const router = Router();
router.use(authenticate);
router.get('/:orderId', paymentController.getPaymentDetails);
export const paymentRoutes = router;
//# sourceMappingURL=payment.routes.js.map