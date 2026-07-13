import { apiRequest } from "@/services/api";
import { CACHE_TAGS } from "@/lib/cache-tags";

export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export interface CategoryListResponse {
  categories: Category[];
}

const CATEGORIES_REVALIDATE_SECONDS = 300;

export async function getCategories(): Promise<CategoryListResponse> {
  return apiRequest<CategoryListResponse>("/v1/categories", {
    method: "GET",
    next: { revalidate: CATEGORIES_REVALIDATE_SECONDS, tags: [CACHE_TAGS.categories] },
  });
}
