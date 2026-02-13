import { apiRequest } from "./api";

export type ProductImage = string;

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  inventory?: { stock: number } | null;
}

export interface ProductSummary {
  id: string;
  title: string;
  images?: ProductImage[];
  category?: { name: string } | null;
}

export interface ProductDetail extends ProductSummary {
  description?: string | null;
  variants: ProductVariant[];
}

export interface ProductListResponse {
  data: ProductSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getProducts(params: {
  page: number;
  limit: number;
  categoryId?: string;
  search?: string;
}): Promise<ProductListResponse> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.search) query.set("search", params.search);

  return apiRequest<ProductListResponse>(`/v1/products?${query.toString()}`, {
    method: "GET",
  });
}

export async function getProductById(id: string) {
  return apiRequest<{ product: ProductDetail }>(`/v1/products/${id}`, {
    method: "GET",
  });
}
