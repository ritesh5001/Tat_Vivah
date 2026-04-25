import { z } from 'zod';

const dataImageSchema = z
    .string()
    .min(100, 'User image is required')
    .refine((value) => /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value), {
        message: 'User image must be a base64 data URL',
    });

export const createTryOnSchema = z.object({
    body: z.object({
        productId: z.string().min(1, 'Product ID is required'),
        variantId: z.string().min(1).optional(),
        userImage: dataImageSchema,
        prompt: z.string().trim().max(300).optional(),
    }),
});

export type CreateTryOnInput = z.infer<typeof createTryOnSchema>['body'];
