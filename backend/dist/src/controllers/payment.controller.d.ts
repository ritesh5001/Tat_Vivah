import { Request, Response } from 'express';
export declare class PaymentController {
    initiatePayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    verifyPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    retryPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPaymentDetails: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export declare const paymentController: PaymentController;
//# sourceMappingURL=payment.controller.d.ts.map