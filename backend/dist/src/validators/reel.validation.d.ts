import { z } from 'zod';
export declare const createReelSchema: z.ZodObject<{
    videoUrl: z.ZodString;
    thumbnailUrl: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    productId: z.ZodOptional<z.ZodString>;
    durationSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    videoUrl: string;
    productId?: string | undefined;
    thumbnailUrl?: string | undefined;
    caption?: string | undefined;
    durationSeconds?: number | undefined;
}, {
    videoUrl: string;
    productId?: string | undefined;
    thumbnailUrl?: string | undefined;
    caption?: string | undefined;
    durationSeconds?: number | undefined;
}>;
export type CreateReelInput = z.infer<typeof createReelSchema>;
export declare const reelQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
    status: z.ZodOptional<z.ZodEnum<["PENDING", "APPROVED", "REJECTED"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "PENDING" | "APPROVED" | "REJECTED" | undefined;
}, {
    status?: "PENDING" | "APPROVED" | "REJECTED" | undefined;
    page?: string | undefined;
    limit?: string | undefined;
}>;
export type ReelQueryInput = z.infer<typeof reelQuerySchema>;
//# sourceMappingURL=reel.validation.d.ts.map