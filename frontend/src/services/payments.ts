import { apiRequest } from "@/services/api";

export type PaymentProvider = "RAZORPAY" | "MOCK";

export interface InitiatePaymentResponse {
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    key: string;
    provider: string;
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
