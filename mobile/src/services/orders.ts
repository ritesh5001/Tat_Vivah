import { apiRequest } from "./api";
import { API_BASE_URL } from "./api";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

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
  shipmentStatus?: string | null;
  cancellationRequest?: {
    id: string;
    status: "REQUESTED" | "APPROVED" | "REJECTED";
  } | null;
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

/**
 * Download invoice PDF and open the native share sheet.
 */
export async function downloadInvoice(
  orderId: string,
  token: string
): Promise<void> {
  const downloadUri = `${API_BASE_URL}/v1/orders/${orderId}/invoice`;
  const fileUri = `${FileSystem.cacheDirectory ?? ""}invoice-${orderId}.pdf`;

  const result = await FileSystem.downloadAsync(downloadUri, fileUri, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status !== 200) {
    throw new Error("Unable to download invoice");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      dialogTitle: "Invoice",
      UTI: "com.adobe.pdf",
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }
}
