/**
 * Razorpay Client Configuration
 *
 * Initializes the Razorpay SDK client using environment credentials.
 * This is a singleton instance used throughout the application.
 */
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
// Validate Razorpay credentials are present
function validateRazorpayCredentials() {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        console.warn('[Razorpay] Warning: Razorpay credentials not configured. Razorpay payments will not work.');
    }
}
// Initialize client only if credentials exist
function createRazorpayClient() {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        return null;
    }
    return new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
    });
}
validateRazorpayCredentials();
/**
 * Razorpay client instance
 * May be null if credentials are not configured
 */
export const razorpayClient = createRazorpayClient();
/**
 * Check if Razorpay is configured and available
 */
export function isRazorpayConfigured() {
    return razorpayClient !== null;
}
/**
 * Get Razorpay Key ID for frontend
 */
export function getRazorpayKeyId() {
    return env.RAZORPAY_KEY_ID || '';
}
//# sourceMappingURL=razorpay.client.js.map