/**
 * Razorpay Client Configuration
 *
 * Initializes the Razorpay SDK client using environment credentials.
 * This is a singleton instance used throughout the application.
 */
import Razorpay from 'razorpay';
/**
 * Razorpay client instance
 * May be null if credentials are not configured
 */
export declare const razorpayClient: Razorpay | null;
/**
 * Check if Razorpay is configured and available
 */
export declare function isRazorpayConfigured(): boolean;
/**
 * Get Razorpay Key ID for frontend
 */
export declare function getRazorpayKeyId(): string;
//# sourceMappingURL=razorpay.client.d.ts.map