import { z } from 'zod';
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('3000'),
    // Database
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
    // JWT Secrets
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    // Token Expiry
    ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
    // Upstash Redis
    UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
    REDIS_URL: z.string().url('REDIS_URL must be a valid URL (rediss://...)').optional(),
    // Resend
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
    EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email'),
    // ImageKit
    IMAGEKIT_PUBLIC_KEY: z.string().optional(),
    IMAGEKIT_PRIVATE_KEY: z.string().optional(),
    IMAGEKIT_URL_ENDPOINT: z.string().optional(),
    // Razorpay
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});
/**
 * Parse and validate environment variables
 * Throws detailed error if validation fails
 */
function parseEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const formattedErrors = result.error.errors
            .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
            .join('\n');
        throw new Error(`❌ Environment validation failed:\n${formattedErrors}\n\nPlease check your .env file.`);
    }
    return result.data;
}
/**
 * Validated environment configuration
 * Singleton pattern - parsed once on import
 */
export const env = parseEnv();
//# sourceMappingURL=env.js.map