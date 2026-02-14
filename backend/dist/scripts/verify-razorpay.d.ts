/**
 * Razorpay Payment Integration Verification Script
 *
 * Tests the complete Razorpay payment flow:
 * 1. Create test data (buyer, seller, product, order)
 * 2. Initiate Razorpay payment
 * 3. Simulate webhook (payment.captured)
 * 4. Verify order status updated
 * 5. Verify seller settlement created
 * 6. Verify notification queued
 */
declare function verifyRazorpay(): Promise<void>;
export { verifyRazorpay };
//# sourceMappingURL=verify-razorpay.d.ts.map