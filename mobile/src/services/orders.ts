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

export async function listBuyerOrders(token?: string | null) {
  return apiRequest<BuyerOrderListResponse>("/v1/orders", {
    method: "GET",
    token,
  });
}
