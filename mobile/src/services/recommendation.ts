import { apiRequest } from "./api";

export interface RecommendationProduct {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  sellerPrice: number;
  adminListingPrice: number | null;
  category: { id: string; name: string } | null;
  recommendationScore: number;
}

interface RecommendationResponse {
  products: RecommendationProduct[];
}

export async function getRecommendations(signal?: AbortSignal): Promise<RecommendationProduct[]> {
  const data = await apiRequest<RecommendationResponse>(
    "/v1/personalization/recommendations",
    {
      method: "GET",
      signal,
    },
  );
  return data.products ?? [];
}
