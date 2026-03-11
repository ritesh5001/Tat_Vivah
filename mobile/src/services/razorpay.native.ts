/**
 * Razorpay checkout integration for native platforms.
 *
 * REQUIRED DEPENDENCY:
 *   npx expo install react-native-razorpay
 *
 * After installing, rebuild your dev client:
 *   eas build --profile development --platform all
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

interface RazorpayModule {
  open: (options: RazorpayCheckoutOptions) => Promise<RazorpaySuccessResponse>;
}

export function isRazorpayAvailable(): boolean {
  try {
    const mod = require("react-native-razorpay");
    const resolved = (mod?.default ?? mod) as RazorpayModule | null | undefined;
    return Boolean(resolved && typeof resolved.open === "function");
  } catch {
    return false;
  }
}

function getRazorpayModule(): RazorpayModule {
  try {
    const mod = require("react-native-razorpay");
    const resolved = (mod?.default ?? mod) as RazorpayModule | null | undefined;
    if (!resolved || typeof resolved.open !== "function") {
      throw new Error("Razorpay module is not available");
    }
    return resolved;
  } catch {
    throw new Error(
      "Razorpay SDK is not available. Install react-native-razorpay and rebuild the dev client."
    );
  }
}

export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<RazorpaySuccessResponse> {
  const razorpay = getRazorpayModule();
  return razorpay.open(options);
}
