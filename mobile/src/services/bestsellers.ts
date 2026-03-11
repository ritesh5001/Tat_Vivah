import { apiRequest } from "./api";
import { getCache, setCache } from "./cache";

export interface BestsellerProduct {
  id: string;
  productId: string;
  position: number;
  title: string;
  image?: string | null;
  categoryName?: string | null;
  minPrice?: number | null;
  salePrice?: number | null;
  adminPrice?: number | null;
  regularPrice?: number | null;
}

const BESTSELLERS_CACHE_KEY = "bestsellers:v1";

export async function getBestsellers(limit?: number) {
  const query = typeof limit === "number" ? `?limit=${limit}` : "";
  return apiRequest<{ products: BestsellerProduct[] }>(
    `/v1/bestsellers${query}`,
    { method: "GET" }
  );
}

export async function getBestsellersCached() {
  return getCache<{ products: BestsellerProduct[] }>(BESTSELLERS_CACHE_KEY);
}

export async function getBestsellersAndCache(limit?: number) {
  const response = await getBestsellers(limit);
  await setCache(BESTSELLERS_CACHE_KEY, response);
  return response;
}
