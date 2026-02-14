/**
 * Admin Validation
 * Zod schemas for admin API request validation
 */
import { z } from 'zod';
export declare const sellerIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const productIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const productRejectSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const productSetPriceSchema: z.ZodObject<{
    adminListingPrice: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    adminListingPrice: number;
}, {
    adminListingPrice: number;
}>;
export declare const orderIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const auditLogQuerySchema: z.ZodObject<{
    entityType: z.ZodOptional<z.ZodEnum<["USER", "PRODUCT", "ORDER", "PAYMENT"]>>;
    entityId: z.ZodOptional<z.ZodString>;
    actorId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    actorId?: string | undefined;
    entityType?: "USER" | "PRODUCT" | "ORDER" | "PAYMENT" | undefined;
    entityId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    actorId?: string | undefined;
    entityType?: "USER" | "PRODUCT" | "ORDER" | "PAYMENT" | undefined;
    entityId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type SellerIdParam = z.infer<typeof sellerIdParamSchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
export type ProductRejectInput = z.infer<typeof productRejectSchema>;
export type ProductSetPriceInput = z.infer<typeof productSetPriceSchema>;
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
//# sourceMappingURL=admin.validation.d.ts.map