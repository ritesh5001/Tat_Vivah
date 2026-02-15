import { apiRequest } from "@/services/api";

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  priceSnapshot: number;
  sellerPriceSnapshot?: number;
  adminPriceSnapshot?: number;
  productTitle?: string;
  variantSku?: string;
}

export interface BuyerOrder {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  shipmentStatus?: string | null;
  cancellationRequest?: {
    id: string;
    status: "REQUESTED" | "APPROVED" | "REJECTED";
  } | null;
}

export interface BuyerOrderListResponse {
  orders: BuyerOrder[];
}

export interface SellerOrderItem {
  id: string;
  orderId: string;
  quantity: number;
  priceSnapshot: number;
  productTitle?: string;
  variantSku?: string;
  order: {
    id: string;
    status: string;
    createdAt: string;
  };
}

export interface SellerOrderListResponse {
  orderItems: SellerOrderItem[];
}

export async function listBuyerOrders(token?: string | null) {
  return apiRequest<BuyerOrderListResponse>("/v1/orders", {
    method: "GET",
    token,
  });
}

export async function listSellerOrders(token?: string | null) {
  return apiRequest<SellerOrderListResponse>("/v1/seller/orders", {
    method: "GET",
    token,
  });
}
