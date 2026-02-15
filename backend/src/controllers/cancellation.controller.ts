import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { cancellationService } from '../services/cancellation.service.js';

const requestCancellationSchema = z.object({
    reason: z.string().min(3).max(500),
});

const rejectCancellationSchema = z.object({
    reason: z.string().min(3).max(500).optional(),
});

export class CancellationController {
    /**
     * POST /v1/cancellations/:orderId
     */
    async requestCancellation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const orderId = req.params.orderId as string;
            const payload = requestCancellationSchema.parse(req.body);
            const cancellation = await cancellationService.requestCancellation(userId, orderId, payload.reason);
            res.status(201).json({ cancellation });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /v1/cancellations/my
     */
    async getMyCancellations(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const result = await cancellationService.getMyCancellations(userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /v1/cancellations/:id/approve
     */
    async approveCancellation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user!.userId;
            const cancellationId = req.params.id as string;
            const result = await cancellationService.approveCancellation(adminId, cancellationId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /v1/cancellations/:id/reject
     */
    async rejectCancellation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user!.userId;
            const cancellationId = req.params.id as string;
            const payload = rejectCancellationSchema.parse(req.body ?? {});
            const result = await cancellationService.rejectCancellation(adminId, cancellationId, payload.reason);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export const cancellationController = new CancellationController();
