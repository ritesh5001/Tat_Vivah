import { apiRequest } from "@/services/api";

export interface BestsellerProduct {
  id: string;
  productId: string;
  position: number;
  title: string;
  image?: string | null;
  categoryName?: string | null;
  regularPrice?: number | null;
  sellerPrice?: number | null;
  adminPrice?: number | null;
  salePrice?: number | null;
  minPrice?: number | null;
}

export async function getBestsellers(limit?: number) {
  const query = typeof limit === "number" ? `?limit=${limit}` : "";
  return apiRequest<{ products: BestsellerProduct[] }>(
    `/v1/bestsellers${query}`,
    {
      method: "GET",
    }
  );
}
