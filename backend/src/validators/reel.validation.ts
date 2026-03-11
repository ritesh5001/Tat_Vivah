import { z } from 'zod';

export const createReelSchema = z.object({
    videoUrl: z.string().url('Valid video URL is required'),
    thumbnailUrl: z.string().url('Valid thumbnail URL is required').optional(),
    caption: z.string().max(500, 'Caption must be at most 500 characters').optional(),
    productId: z.string().min(1, 'Product ID must not be empty').optional(),
});

export type CreateReelInput = z.infer<typeof createReelSchema>;

export const reelQuerySchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('20'),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export type ReelQueryInput = z.infer<typeof reelQuerySchema>;
