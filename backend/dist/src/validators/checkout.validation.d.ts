import { z } from 'zod';
/**
 * Checkout Validation Schema
 * POST /v1/checkout
 */
export declare const checkoutSchema: z.ZodObject<{
    body: z.ZodObject<{
        shippingName: z.ZodOptional<z.ZodString>;
        shippingPhone: z.ZodOptional<z.ZodString>;
        shippingEmail: z.ZodOptional<z.ZodString>;
        shippingAddressLine1: z.ZodOptional<z.ZodString>;
        shippingAddressLine2: z.ZodOptional<z.ZodString>;
        shippingCity: z.ZodOptional<z.ZodString>;
        shippingNotes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        shippingName?: string | undefined;
        shippingPhone?: string | undefined;
        shippingEmail?: string | undefined;
        shippingAddressLine1?: string | undefined;
        shippingAddressLine2?: string | undefined;
        shippingCity?: string | undefined;
        shippingNotes?: string | undefined;
    }, {
        shippingName?: string | undefined;
        shippingPhone?: string | undefined;
        shippingEmail?: string | undefined;
        shippingAddressLine1?: string | undefined;
        shippingAddressLine2?: string | undefined;
        shippingCity?: string | undefined;
        shippingNotes?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        shippingName?: string | undefined;
        shippingPhone?: string | undefined;
        shippingEmail?: string | undefined;
        shippingAddressLine1?: string | undefined;
        shippingAddressLine2?: string | undefined;
        shippingCity?: string | undefined;
        shippingNotes?: string | undefined;
    };
}, {
    body: {
        shippingName?: string | undefined;
        shippingPhone?: string | undefined;
        shippingEmail?: string | undefined;
        shippingAddressLine1?: string | undefined;
        shippingAddressLine2?: string | undefined;
        shippingCity?: string | undefined;
        shippingNotes?: string | undefined;
    };
}>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
//# sourceMappingURL=checkout.validation.d.ts.map