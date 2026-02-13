import { apiRequest } from "./api";

export interface BestsellerProduct {
  id: string;
  productId: string;
  position: number;
  title: string;
  image?: string | null;
  categoryName?: string | null;
  minPrice?: number | null;
}

export async function getBestsellers(limit?: number) {
  const query = typeof limit === "number" ? `?limit=${limit}` : "";
  return apiRequest<{ products: BestsellerProduct[] }>(
    `/v1/bestsellers${query}`,
    { method: "GET" }
  );
}
