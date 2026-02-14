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

function getRazorpayModule(): RazorpayModule {
  try {
    const mod = require("react-native-razorpay");
    return (mod.default ?? mod) as RazorpayModule;
  } catch {
    throw new Error(
      "react-native-razorpay is not installed. Run: npx expo install react-native-razorpay"
    );
  }
}

export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<RazorpaySuccessResponse> {
  const razorpay = getRazorpayModule();
  return razorpay.open(options);
}
