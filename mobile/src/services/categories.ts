import { apiRequest } from "./api";

export interface CategoryItem {
  id: string;
  name: string;
}

export async function getCategories() {
  const response = await apiRequest<{ categories: CategoryItem[] }>("/v1/categories", {
    method: "GET",
  });
  return response;
}
