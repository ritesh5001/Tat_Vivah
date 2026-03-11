import { apiRequest } from "@/services/api";

// ============================================================================
// TYPES
// ============================================================================

export interface Reel {
  id: string;
  sellerId: string;
  productId: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    title: string;
    images: string[];
    adminListingPrice: number | null;
    sellerPrice: number;
    status: string;
  } | null;
  seller?: {
    id: string;
    email: string | null;
    seller_profiles: {
      store_name: string;
    } | null;
  };
}

export interface ReelListResponse {
  reels: Reel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateReelPayload {
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  productId?: string;
}

// ============================================================================
// SELLER APIs
// ============================================================================

export async function listSellerReels(token?: string | null) {
  return apiRequest<ReelListResponse>("/v1/seller/reels", {
    method: "GET",
    token,
  });
}

export async function createSellerReel(
  payload: CreateReelPayload,
  token?: string | null
) {
  return apiRequest<{ message: string; reel: Reel }>("/v1/seller/reels", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function deleteSellerReel(
  reelId: string,
  token?: string | null
) {
  return apiRequest<{ message: string }>(`/v1/seller/reels/${reelId}`, {
    method: "DELETE",
    token,
  });
}

// ============================================================================
// ADMIN APIs
// ============================================================================

export async function listAdminReels(
  params?: { status?: string; page?: number; limit?: number },
  token?: string | null
) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return apiRequest<ReelListResponse>(`/v1/admin/reels${qs ? `?${qs}` : ""}`, {
    method: "GET",
    token,
  });
}

export async function approveReel(reelId: string, token?: string | null) {
  return apiRequest<{ message: string; reel: Reel }>(
    `/v1/admin/reels/${reelId}/approve`,
    { method: "PATCH", token }
  );
}

export async function rejectReel(reelId: string, token?: string | null) {
  return apiRequest<{ message: string; reel: Reel }>(
    `/v1/admin/reels/${reelId}/reject`,
    { method: "PATCH", token }
  );
}

export async function deleteReelAdmin(reelId: string, token?: string | null) {
  return apiRequest<{ message: string }>(`/v1/admin/reels/${reelId}`, {
    method: "DELETE",
    token,
  });
}

// ============================================================================
// PUBLIC APIs
// ============================================================================

export async function listPublicReels(
  params?: { page?: number; limit?: number },
  token?: string | null
) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return apiRequest<ReelListResponse>(`/v1/reels${qs ? `?${qs}` : ""}`, {
    method: "GET",
    token,
  });
}

export async function getPublicReel(reelId: string) {
  return apiRequest<{ reel: Reel }>(`/v1/reels/${reelId}`, {
    method: "GET",
  });
}
