import { z } from 'zod';
/**
 * Environment variable schema with validation
 */
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    DATABASE_URL: z.ZodString;
    JWT_ACCESS_SECRET: z.ZodString;
    JWT_REFRESH_SECRET: z.ZodString;
    ACCESS_TOKEN_EXPIRY: z.ZodDefault<z.ZodString>;
    REFRESH_TOKEN_EXPIRY: z.ZodDefault<z.ZodString>;
    REDIS_URL: z.ZodOptional<z.ZodString>;
    UPSTASH_REDIS_REST_URL: z.ZodOptional<z.ZodString>;
    UPSTASH_REDIS_REST_TOKEN: z.ZodOptional<z.ZodString>;
    RESEND_API_KEY: z.ZodString;
    EMAIL_FROM: z.ZodString;
    IMAGEKIT_PUBLIC_KEY: z.ZodOptional<z.ZodString>;
    IMAGEKIT_PRIVATE_KEY: z.ZodOptional<z.ZodString>;
    IMAGEKIT_URL_ENDPOINT: z.ZodOptional<z.ZodString>;
    RAZORPAY_KEY_ID: z.ZodOptional<z.ZodString>;
    RAZORPAY_KEY_SECRET: z.ZodOptional<z.ZodString>;
    RAZORPAY_WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "production" | "development" | "test";
    PORT: number;
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ACCESS_TOKEN_EXPIRY: string;
    REFRESH_TOKEN_EXPIRY: string;
    RESEND_API_KEY: string;
    EMAIL_FROM: string;
    REDIS_URL?: string | undefined;
    UPSTASH_REDIS_REST_URL?: string | undefined;
    UPSTASH_REDIS_REST_TOKEN?: string | undefined;
    IMAGEKIT_PUBLIC_KEY?: string | undefined;
    IMAGEKIT_PRIVATE_KEY?: string | undefined;
    IMAGEKIT_URL_ENDPOINT?: string | undefined;
    RAZORPAY_KEY_ID?: string | undefined;
    RAZORPAY_KEY_SECRET?: string | undefined;
    RAZORPAY_WEBHOOK_SECRET?: string | undefined;
}, {
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    RESEND_API_KEY: string;
    EMAIL_FROM: string;
    NODE_ENV?: "production" | "development" | "test" | undefined;
    PORT?: string | undefined;
    ACCESS_TOKEN_EXPIRY?: string | undefined;
    REFRESH_TOKEN_EXPIRY?: string | undefined;
    REDIS_URL?: string | undefined;
    UPSTASH_REDIS_REST_URL?: string | undefined;
    UPSTASH_REDIS_REST_TOKEN?: string | undefined;
    IMAGEKIT_PUBLIC_KEY?: string | undefined;
    IMAGEKIT_PRIVATE_KEY?: string | undefined;
    IMAGEKIT_URL_ENDPOINT?: string | undefined;
    RAZORPAY_KEY_ID?: string | undefined;
    RAZORPAY_KEY_SECRET?: string | undefined;
    RAZORPAY_WEBHOOK_SECRET?: string | undefined;
}>;
/**
 * Parsed and validated environment variables type
 */
export type Env = z.infer<typeof envSchema>;
/**
 * Validated environment configuration
 * Singleton pattern - parsed once on import
 */
export declare const env: Env;
export {};
//# sourceMappingURL=env.d.ts.map