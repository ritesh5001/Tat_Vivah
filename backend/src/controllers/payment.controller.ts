
import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export class PaymentController {

    initiatePayment = asyncHandler(async (req: Request, res: Response) => {
        const { orderId, provider } = req.body;
        const userId = (req as any).user.userId;

        const result = await paymentService.initiatePayment(userId, orderId, provider);

        res.status(200).json({
            success: true,
            data: result
        });
    });

    verifyPayment = asyncHandler(async (req: Request, res: Response) => {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        const userId = (req as any).user.userId;

        const result = await paymentService.verifyRazorpayPayment(
            userId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        res.status(200).json({
            success: true,
            data: result
        });
    });

    retryPayment = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.orderId as string;
        const userId = (req as any).user.userId;

        if (!orderId) {
            throw new Error('Order ID required');
        }

        const result = await paymentService.retryPayment(userId, orderId);

        res.status(200).json({
            success: true,
            data: result
        });
    });

    getPaymentDetails = asyncHandler(async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const userId = (req as any).user.userId;

        if (!orderId) {
            throw new Error("Order ID required");
        }

        const payment = await paymentService.getPaymentDetails(orderId as string, userId);

        res.status(200).json({
            success: true,
            data: payment
        });
    });
}

export const paymentController = new PaymentController();

