import { apiRequest } from "./api";

// ---------------------------------------------------------------------------
// Types — mirrors backend TrackingResponse / ShipmentStatus
// ---------------------------------------------------------------------------
export type ShipmentStatus = "CREATED" | "SHIPPED" | "DELIVERED";

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  note: string | null;
  createdAt: string;
}

export interface Shipment {
  id: string;
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  events: ShipmentEvent[];
}

export interface TrackingResponse {
  orderId: string;
  /** Order-level status (e.g. "PLACED", "PROCESSING", "SHIPPED", etc.) */
  status: string;
  shipments: Shipment[];
}

/** Whether the shipment has reached a terminal state. */
export function isTerminalStatus(status: ShipmentStatus): boolean {
  return status === "DELIVERED";
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Fetch tracking info for a buyer order. */
export async function getOrderTracking(
  orderId: string,
  token?: string | null
): Promise<TrackingResponse> {
  const response = await apiRequest<{ data: TrackingResponse }>(
    `/v1/orders/${orderId}/tracking`,
    { method: "GET", token }
  );
  return response.data;
}
