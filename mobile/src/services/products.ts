import { apiRequest } from "./api";

export type ProductImage = string;

export interface ProductVariant {
  id: string;
  sku: string;
  /** Public listing price set by admin. Never the seller cost price. */
  price: number;
  compareAtPrice?: number | null;
  inventory?: { stock: number } | null;
}

export interface ProductSummary {
  id: string;
  categoryId?: string;
  title: string;
  images?: ProductImage[];
  category?: { id?: string; name: string } | null;
  /** Public listing price (admin-set). Available on list endpoints. */
  price?: number;
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
  sort?: string;
  signal?: AbortSignal;
}): Promise<ProductListResponse> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.search) query.set("search", params.search);
  if (params.sort) query.set("sort", params.sort);

  return apiRequest<ProductListResponse>(`/v1/products?${query.toString()}`, {
    method: "GET",
    signal: params.signal,
  });
}

export async function getProductById(id: string, signal?: AbortSignal) {
  return apiRequest<{ product: ProductDetail }>(`/v1/products/${id}`, {
    method: "GET",
    signal,
  });
}

/**
 * Fetch "related" products — same category, excluding the current product.
 * Uses the existing list endpoint with a categoryId filter.
 */
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  signal?: AbortSignal
): Promise<ProductSummary[]> {
  const res = await getProducts({
    page: 1,
    limit: 10,
    categoryId,
    signal,
  });
  return res.data.filter((p) => p.id !== excludeProductId);
}
