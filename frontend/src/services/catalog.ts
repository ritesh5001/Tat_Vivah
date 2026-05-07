import { apiRequest } from "@/services/api";

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

export async function getCategories(): Promise<CategoryListResponse> {
  return apiRequest<CategoryListResponse>("/v1/categories", {
    method: "GET",
  });
}
