import { apiRequest } from "./api";

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  priceSnapshot: number;
  productTitle?: string;
  variantSku?: string;
}

export interface BuyerOrder {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export interface BuyerOrderListResponse {
  orders: BuyerOrder[];
}

/** Full order detail (GET /v1/orders/:id) */
export interface BuyerOrderDetail {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingEmail?: string | null;
  shippingAddressLine1?: string | null;
  shippingAddressLine2?: string | null;
  shippingCity?: string | null;
  shippingNotes?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface BuyerOrderDetailResponse {
  order: BuyerOrderDetail;
}

export async function listBuyerOrders(token?: string | null) {
  return apiRequest<BuyerOrderListResponse>("/v1/orders", {
    method: "GET",
    token,
  });
}

/** Fetch a single order's full detail. */
export async function getBuyerOrderDetail(
  orderId: string,
  token?: string | null,
  signal?: AbortSignal
) {
  return apiRequest<BuyerOrderDetailResponse>(`/v1/orders/${orderId}`, {
    method: "GET",
    token,
    signal,
  });
}
