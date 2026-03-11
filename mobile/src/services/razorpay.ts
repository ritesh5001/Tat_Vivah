/**
 * Razorpay checkout integration (web/default stub).
 *
 * Native implementation lives in `razorpay.native.ts`.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  theme?: { color?: string };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export function isRazorpayAvailable(): boolean {
  return false;
}

export async function openRazorpayCheckout(
  _options: RazorpayCheckoutOptions
): Promise<RazorpaySuccessResponse> {
  throw new Error(
    "Razorpay checkout is not available on web. Please use Android/iOS with a custom dev client."
  );
}
