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
    TRUST_PROXY: z.string().default('1').transform((v) => {
        const normalized = v.trim().toLowerCase();
        if (normalized === 'false' || normalized === '0' || normalized === 'off')
            return 0;
        if (normalized === 'true' || normalized === 'on')
            return 1;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 1;
    }),
    KEEP_ALIVE_TIMEOUT_MS: z.string().default('65000').transform(Number),
    HEADERS_TIMEOUT_MS: z.string().default('70000').transform(Number),
    REQUEST_TIMEOUT_MS: z.string().default('120000').transform(Number),
    MAX_REQUESTS_PER_SOCKET: z.string().default('1000').transform(Number),
    RUN_BACKGROUND_JOBS: z.string().optional().transform((v) => {
        if (!v)
            return undefined;
        const normalized = v.trim().toLowerCase();
        return !(normalized === 'false' || normalized === '0' || normalized === 'off');
    }),
    BACKEND_WARMUP_URL: z.string().url('BACKEND_WARMUP_URL must be a valid URL').optional(),
    BACKEND_WARMUP_INTERVAL_MS: z.string().default('240000').transform(Number),
    PRISMA_LOG_QUERIES: z.string().default('false').transform((v) => {
        const normalized = v.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'on';
    }),
    // Database
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
    DATABASE_URL_DIRECT: z.string().url('DATABASE_URL_DIRECT must be a valid URL').optional(),
    // JWT Secrets
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    // Token Expiry
    ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
    // Public portal URLs (used in email CTA links)
    FRONTEND_BASE_URL: z.string().url('FRONTEND_BASE_URL must be a valid URL').optional(),
    SELLER_BASE_URL: z.string().url('SELLER_BASE_URL must be a valid URL').optional(),
    FRONTEND_REVALIDATE_URL: z.string().url('FRONTEND_REVALIDATE_URL must be a valid URL').optional(),
    FRONTEND_REVALIDATE_SECRET: z.string().min(1, 'FRONTEND_REVALIDATE_SECRET cannot be empty').optional(),
    LIVE_EVENTS_CHANNEL: z.string().default('tatvivah:live-events'),
    // Redis
    REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),
    // Legacy Upstash vars retained as optional for backwards compatibility
    UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL').optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required').optional(),
    // Resend
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
    EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email'),
    // ImageKit
    IMAGEKIT_PUBLIC_KEY: z.string().optional(),
    IMAGEKIT_PRIVATE_KEY: z.string().optional(),
    IMAGEKIT_URL_ENDPOINT: z.string().optional(),
    // FASHN virtual try-on
    FASHN_API_KEY: z.string().optional(),
    FASHN_TRYON_MODEL: z.enum(['tryon-max', 'tryon-v1.6']).default('tryon-max'),
    FASHN_POLL_INTERVAL_MS: z.string().default('3000').transform(Number),
    FASHN_POLL_TIMEOUT_MS: z.string().default('115000').transform(Number),
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