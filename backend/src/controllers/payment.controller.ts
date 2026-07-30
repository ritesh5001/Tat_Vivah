
import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

// Payment gateways have been removed. This controller currently only exposes
// read access to a payment record; initiate/verify/retry will be re-added when
// a new gateway is integrated.
export class PaymentController {

    getPaymentDetails = asyncHandler(async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const userId = (req as any).user.userId;

        if (!orderId) {
            throw new Error('Order ID required');
        }

        const payment = await paymentService.getPaymentDetails(orderId as string, userId);

        res.status(200).json({
            success: true,
            data: payment
        });
    });
}

export const paymentController = new PaymentController();
