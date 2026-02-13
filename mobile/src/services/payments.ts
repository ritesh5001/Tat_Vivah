import { apiRequest } from "./api";

export type PaymentProvider = "RAZORPAY" | "MOCK";

export interface InitiatePaymentResponse {
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    key?: string;
    provider: string;
    checkoutUrl?: string;
  };
}

export interface PaymentDetailsResponse {
  data: {
    status: string;
  };
}

export async function initiatePayment(
  orderId: string,
  provider: PaymentProvider = "MOCK",
  token?: string | null
) {
  return apiRequest<InitiatePaymentResponse>("/v1/payments/initiate", {
    method: "POST",
    body: { orderId, provider },
    token,
  });
}

export async function getPaymentDetails(orderId: string, token?: string | null) {
  return apiRequest<PaymentDetailsResponse>(`/v1/payments/${orderId}`, {
    method: "GET",
    token,
  });
}
