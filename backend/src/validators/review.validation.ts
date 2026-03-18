import { z } from 'zod';

export const createReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().min(3).max(200),
    comment: z.string().min(10).max(2000),
});

export const reviewQuerySchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(50)).optional().default('10'),
    sort: z.enum(['newest', 'oldest', 'highest', 'lowest', 'helpful']).optional().default('newest'),
});

export const hideReviewSchema = z.object({
    isHidden: z.boolean(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
export type HideReviewInput = z.infer<typeof hideReviewSchema>;
