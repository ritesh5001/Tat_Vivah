
import { Request, Response } from 'express';
import { webhookService } from '../services/webhook.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export class WebhookController {

    handleWebhook = asyncHandler(async (req: Request, res: Response) => {
        const provider = req.params['provider'];
        const payload = req.body;

        if (!provider || typeof provider !== 'string') {
            throw new Error("Provider is required");
        }

        // Get signature from appropriate header based on provider
        let signature = '';
        if (provider.toLowerCase() === 'razorpay') {
            signature = (req.headers['x-razorpay-signature'] as string) || '';
        } else if (provider.toLowerCase() === 'phonepe') {
            // PhonePe sends SHA256(username:password) in the Authorization header
            signature = (req.headers['authorization'] as string) || '';
        } else {
            signature = (req.headers['x-signature'] as string) || '';
        }

        // Pass raw body for signature verification (Razorpay needs this)
        const rawBody = JSON.stringify(payload);

        await webhookService.processWebhook(provider, payload, signature, rawBody);

        res.status(200).json({
            success: true,
            message: 'Webhook processed'
        });
    });
}

export const webhookController = new WebhookController();
