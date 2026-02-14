import { paymentService } from '../services/payment.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
export class PaymentController {
    initiatePayment = asyncHandler(async (req, res) => {
        const { orderId, provider } = req.body;
        const userId = req.user.userId;
        const result = await paymentService.initiatePayment(userId, orderId, provider);
        res.status(200).json({
            success: true,
            data: result
        });
    });
    verifyPayment = asyncHandler(async (req, res) => {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        const userId = req.user.userId;
        const result = await paymentService.verifyRazorpayPayment(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
        res.status(200).json({
            success: true,
            data: result
        });
    });
    getPaymentDetails = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const userId = req.user.userId;
        if (!orderId) {
            throw new Error("Order ID required");
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