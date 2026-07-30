import { apiRequest } from "./api";

export interface InitiatePaymentResponse {
  data: {
    paymentId: string;
    orderId: string;
    phonepeOrderId?: string;
    /** PhonePe hosted checkout page — open this in the browser. */
    redirectUrl?: string;
    amount: number;
    currency: string;
    provider: string;
  };
}

export interface PhonePeVerifyResponse {
  data: {
    status: "SUCCESS" | "FAILED" | "PENDING";
    paymentId: string;
    message: string;
  };
}

export interface PaymentDetailsResponse {
  data: { status: string };
}

/** Initiate a PhonePe payment for an order → returns a redirectUrl. */
export async function initiatePayment(orderId: string, token?: string | null) {
  return apiRequest<InitiatePaymentResponse>("/v1/payments/initiate", {
    method: "POST",
    body: { orderId, platform: "MOBILE" },
    token,
  });
}

/** Confirm a PhonePe payment after the buyer returns from the browser. */
export async function verifyPhonePePayment(orderId: string, token?: string | null) {
  return apiRequest<PhonePeVerifyResponse>("/v1/payments/phonepe/verify", {
    method: "POST",
    body: { orderId },
    token,
  });
}

export async function retryPayment(orderId: string, token?: string | null) {
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
