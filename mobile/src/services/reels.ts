import { apiRequest } from "./api";

export type PublicReel = {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  productId: string | null;
  product?: {
    id: string;
    title: string;
    images: string[];
  } | null;
};

export type PublicReelListResponse = {
  reels: PublicReel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function listPublicReels(params?: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const queryString = searchParams.toString();
  return apiRequest<PublicReelListResponse>(`/v1/reels${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
}
