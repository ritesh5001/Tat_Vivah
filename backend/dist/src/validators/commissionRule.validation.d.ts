import { z } from 'zod';
export declare const createCommissionRuleSchema: z.ZodObject<{
    sellerId: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    commissionPercent: z.ZodNumber;
    platformFee: z.ZodNumber;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    commissionPercent: number;
    platformFee: number;
    isActive: boolean;
    sellerId?: string | undefined;
    categoryId?: string | undefined;
}, {
    commissionPercent: number;
    platformFee: number;
    sellerId?: string | undefined;
    categoryId?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const updateCommissionRuleSchema: z.ZodObject<{
    sellerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    commissionPercent: z.ZodOptional<z.ZodNumber>;
    platformFee: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    sellerId?: string | null | undefined;
    categoryId?: string | null | undefined;
    commissionPercent?: number | undefined;
    platformFee?: number | undefined;
    isActive?: boolean | undefined;
}, {
    sellerId?: string | null | undefined;
    categoryId?: string | null | undefined;
    commissionPercent?: number | undefined;
    platformFee?: number | undefined;
    isActive?: boolean | undefined;
}>;
export type CreateCommissionRuleInput = z.infer<typeof createCommissionRuleSchema>;
export type UpdateCommissionRuleInput = z.infer<typeof updateCommissionRuleSchema>;
//# sourceMappingURL=commissionRule.validation.d.ts.map