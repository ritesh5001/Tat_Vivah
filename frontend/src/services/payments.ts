import { apiRequest } from "@/services/api";

export type PaymentProvider = "RAZORPAY" | "PHONEPE" | "COD" | "MOCK";

export interface InitiatePaymentResponse {
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    /** Razorpay key_id (absent for PhonePe/COD). */
    key?: string;
    provider: string;
    /** PhonePe hosted checkout page — redirect the buyer here. */
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

export async function initiatePayment(
  orderId: string,
  provider: PaymentProvider = "RAZORPAY",
  token?: string | null
) {
  return apiRequest<InitiatePaymentResponse>("/v1/payments/initiate", {
    method: "POST",
    body: { orderId, provider },
    token,
  });
}

export async function verifyPayment(payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}, token?: string | null) {
  return apiRequest<VerifyPaymentResponse>("/v1/payments/verify", {
    method: "POST",
    body: payload,
    token,
  });
}

/**
 * Confirm a PhonePe payment after the redirect back (or while polling).
 * The backend checks the authoritative state with PhonePe's Order Status API.
 */
export async function verifyPhonePePayment(orderId: string, token?: string | null) {
  return apiRequest<PhonePeVerifyResponse>("/v1/payments/phonepe/verify", {
    method: "POST",
    body: { orderId },
    token,
  });
}

export async function retryPayment(
  orderId: string,
  token?: string | null
) {
  return apiRequest<InitiatePaymentResponse>(`/v1/payments/retry/${orderId}`, {
    method: "POST",
    token,
  });
}

export async function getPaymentDetails(orderId: string, token?: string | null) {
  return apiRequest<PaymentDetailsResponse>(`/v1/payments/${orderId}`, {
    method: "GET",
    token,
  });
}
