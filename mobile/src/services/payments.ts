import { apiRequest } from "./api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface InitiatePaymentResponse {
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    /** Razorpay key_id — required for opening the checkout SDK. */
    key: string;
    provider: string;
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

/** Initiate a Razorpay payment for the given order. */
export async function initiatePayment(
  orderId: string,
  token?: string | null
) {
  return apiRequest<InitiatePaymentResponse>("/v1/payments/initiate", {
    method: "POST",
    body: { orderId, provider: "RAZORPAY" },
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

export async function getPaymentDetails(
  orderId: string,
  token?: string | null
) {
  return apiRequest<PaymentDetailsResponse>(`/v1/payments/${orderId}`, {
    method: "GET",
    token,
  });
}
