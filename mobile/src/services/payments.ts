import { apiRequest } from "./api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type PaymentProvider = "RAZORPAY" | "PHONEPE" | "COD";

export interface InitiatePaymentResponse {
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    /** Razorpay key_id — required for opening the checkout SDK (absent for PhonePe/COD). */
    key?: string;
    provider: string;
    /** PhonePe hosted checkout page — open this in the browser. */
    redirectUrl?: string;
    /** COD only: order is CONFIRMED immediately, no online payment. */
    status?: string;
  };
}

export interface PhonePeVerifyResponse {
  data: {
    status: "SUCCESS" | "FAILED" | "PENDING";
    paymentId: string;
    message: string;
  };
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  data: {
    message: string;
    paymentId: string;
  };
}

export interface PaymentDetailsResponse {
  data: {
    status: string;
  };
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Initiate a payment for the given order (Razorpay by default). */
export async function initiatePayment(
  orderId: string,
  token?: string | null,
  provider: PaymentProvider = "RAZORPAY"
) {
  return apiRequest<InitiatePaymentResponse>("/v1/payments/initiate", {
    method: "POST",
    body: { orderId, provider, platform: "MOBILE" },
    token,
  });
}

/**
 * Confirm a PhonePe payment after the buyer returns from the browser.
 * The backend checks the authoritative state with PhonePe's Order Status API.
 */
export async function verifyPhonePePayment(
  orderId: string,
  token?: string | null
) {
  return apiRequest<PhonePeVerifyResponse>("/v1/payments/phonepe/verify", {
    method: "POST",
    body: { orderId },
    token,
  });
}

/** Verify a Razorpay payment using the SDK callback parameters. */
export async function verifyPayment(
  payload: VerifyPaymentPayload,
  token?: string | null
) {
  return apiRequest<VerifyPaymentResponse>("/v1/payments/verify", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function retryPayment(
  orderId: string,
  token?: string | null
) {
  return apiRequest<InitiatePaymentResponse>(`/v1/payments/retry/${orderId}`, {
    method: "POST",
    body: { platform: "MOBILE" },
    token,
  });
}

export async function getPaymentDetails(
  orderId: string,
  token?: string | null,
  signal?: AbortSignal
) {
  return apiRequest<PaymentDetailsResponse>(`/v1/payments/${orderId}`, {
    method: "GET",
    token,
    signal,
  });
}
