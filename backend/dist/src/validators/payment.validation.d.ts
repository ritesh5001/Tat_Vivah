import { z } from 'zod';
export declare const initiatePaymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        orderId: z.ZodUnion<[z.ZodString, z.ZodString]>;
        provider: z.ZodNativeEnum<{
            MOCK: "MOCK";
            RAZORPAY: "RAZORPAY";
            STRIPE: "STRIPE";
        }>;
    }, "strip", z.ZodTypeAny, {
        orderId: string;
        provider: "MOCK" | "RAZORPAY" | "STRIPE";
    }, {
        orderId: string;
        provider: "MOCK" | "RAZORPAY" | "STRIPE";
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        orderId: string;
        provider: "MOCK" | "RAZORPAY" | "STRIPE";
    };
}, {
    body: {
        orderId: string;
        provider: "MOCK" | "RAZORPAY" | "STRIPE";
    };
}>;
export declare const verifyPaymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        razorpayOrderId: z.ZodString;
        razorpayPaymentId: z.ZodString;
        razorpaySignature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }, {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    };
}, {
    body: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    };
}>;
export declare const webhookSchema: z.ZodObject<{
    params: z.ZodObject<{
        provider: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: string;
    }, {
        provider: string;
    }>;
    body: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    params: {
        provider: string;
    };
    body?: any;
}, {
    params: {
        provider: string;
    };
    body?: any;
}>;
//# sourceMappingURL=payment.validation.d.ts.map