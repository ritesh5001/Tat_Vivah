import { Request, Response, NextFunction } from 'express';
export declare class PaymentController {
    initiatePayment: (req: Request, res: Response, next: NextFunction) => void;
    verifyPayment: (req: Request, res: Response, next: NextFunction) => void;
    getPaymentDetails: (req: Request, res: Response, next: NextFunction) => void;
}
export declare const paymentController: PaymentController;
//# sourceMappingURL=payment.controller.d.ts.map