import { z } from 'zod';
export declare const createReviewSchema: z.ZodObject<{
    rating: z.ZodNumber;
    title: z.ZodString;
    comment: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    rating: number;
    comment: string;
}, {
    title: string;
    rating: number;
    comment: string;
}>;
export declare const reviewQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
    sort: z.ZodDefault<z.ZodOptional<z.ZodEnum<["newest", "oldest", "highest", "lowest", "helpful"]>>>;
}, "strip", z.ZodTypeAny, {
    sort: "oldest" | "highest" | "lowest" | "helpful" | "newest";
    page: number;
    limit: number;
}, {
    sort?: "oldest" | "highest" | "lowest" | "helpful" | "newest" | undefined;
    page?: string | undefined;
    limit?: string | undefined;
}>;
export declare const hideReviewSchema: z.ZodObject<{
    isHidden: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isHidden: boolean;
}, {
    isHidden: boolean;
}>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
export type HideReviewInput = z.infer<typeof hideReviewSchema>;
//# sourceMappingURL=review.validation.d.ts.map