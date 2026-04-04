import { z } from 'zod';
/**
 * Environment variable schema with validation
 */
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    TRUST_PROXY: z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>;
    KEEP_ALIVE_TIMEOUT_MS: z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>;
    HEADERS_TIMEOUT_MS: z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>;
    REQUEST_TIMEOUT_MS: z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>;
    MAX_REQUESTS_PER_SOCKET: z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>;
    RUN_BACKGROUND_JOBS: z.ZodEffects<z.ZodOptional<z.ZodString>, boolean | undefined, string | undefined>;
    BACKEND_WARMUP_URL: z.ZodOptional<z.ZodString>;
    BACKEND_WARMUP_INTERVAL_MS: z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>;
    DATABASE_URL: z.ZodString;
    JWT_ACCESS_SECRET: z.ZodString;
    JWT_REFRESH_SECRET: z.ZodString;
    ACCESS_TOKEN_EXPIRY: z.ZodDefault<z.ZodString>;
    REFRESH_TOKEN_EXPIRY: z.ZodDefault<z.ZodString>;
    FRONTEND_BASE_URL: z.ZodOptional<z.ZodString>;
    SELLER_BASE_URL: z.ZodOptional<z.ZodString>;
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
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    TRUST_PROXY: number;
    KEEP_ALIVE_TIMEOUT_MS: number;
    HEADERS_TIMEOUT_MS: number;
    REQUEST_TIMEOUT_MS: number;
    MAX_REQUESTS_PER_SOCKET: number;
    BACKEND_WARMUP_INTERVAL_MS: number;
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ACCESS_TOKEN_EXPIRY: string;
    REFRESH_TOKEN_EXPIRY: string;
    RESEND_API_KEY: string;
    EMAIL_FROM: string;
    RUN_BACKGROUND_JOBS?: boolean | undefined;
    BACKEND_WARMUP_URL?: string | undefined;
    FRONTEND_BASE_URL?: string | undefined;
    SELLER_BASE_URL?: string | undefined;
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
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: string | undefined;
    TRUST_PROXY?: string | undefined;
    KEEP_ALIVE_TIMEOUT_MS?: string | undefined;
    HEADERS_TIMEOUT_MS?: string | undefined;
    REQUEST_TIMEOUT_MS?: string | undefined;
    MAX_REQUESTS_PER_SOCKET?: string | undefined;
    RUN_BACKGROUND_JOBS?: string | undefined;
    BACKEND_WARMUP_URL?: string | undefined;
    BACKEND_WARMUP_INTERVAL_MS?: string | undefined;
    ACCESS_TOKEN_EXPIRY?: string | undefined;
    REFRESH_TOKEN_EXPIRY?: string | undefined;
    FRONTEND_BASE_URL?: string | undefined;
    SELLER_BASE_URL?: string | undefined;
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