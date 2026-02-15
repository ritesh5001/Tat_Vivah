
import { z } from 'zod';
import { PaymentProvider } from '@prisma/client';

export const initiatePaymentSchema = z.object({
    body: z.object({
        orderId: z.string().uuid().or(z.string().cuid()), // Assuming CUIDs but flexible
        provider: z.nativeEnum(PaymentProvider)
    })
});

export const verifyPaymentSchema = z.object({
    body: z.object({
        razorpayOrderId: z.string().min(1),
        razorpayPaymentId: z.string().min(1),
        razorpaySignature: z.string().min(1)
    })
});

export const retryPaymentSchema = z.object({
    params: z.object({
        orderId: z.string().min(1),
    }),
});

export const webhookSchema = z.object({
    params: z.object({
        provider: z.string() // Validated in service, but we can refine here if needed
    }),
    body: z.any()
});
