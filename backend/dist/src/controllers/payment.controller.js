import { paymentService } from '../services/payment.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
// Payment gateways have been removed. This controller currently only exposes
// read access to a payment record; initiate/verify/retry will be re-added when
// a new gateway is integrated.
export class PaymentController {
    getPaymentDetails = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const userId = req.user.userId;
        if (!orderId) {
            throw new Error('Order ID required');
        }
        const payment = await paymentService.getPaymentDetails(orderId, userId);
        res.status(200).json({
            success: true,
            data: payment
        });
    });
}
export const paymentController = new PaymentController();
//# sourceMappingURL=payment.controller.js.map