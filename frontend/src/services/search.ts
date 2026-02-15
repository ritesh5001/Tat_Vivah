"use client";

import { apiRequest } from "./api";

export type SortOption = "relevance" | "price_asc" | "price_desc" | "newest" | "popularity";

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResultItem {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  categoryId: string;
  sellerPrice: number;
  adminListingPrice: number | null;
  isPublished: boolean;
  createdAt: string;
  category: { id: string; name: string } | null;
  rank?: number;
}

export interface SearchResponse {
  data: SearchResultItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function searchProducts(params: {
  q: string;
  page?: number;
  limit?: number;
  categoryId?: string;
  sort?: SortOption;
}): Promise<SearchResponse> {
  const query = new URLSearchParams();
  query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.sort) query.set("sort", params.sort);
  return apiRequest<SearchResponse>(`/v1/search?${query.toString()}`, {
    showLoader: false,
  });
}

// ---------------------------------------------------------------------------
// Autocomplete
// ---------------------------------------------------------------------------

export interface SuggestionItem {
  id: string;
  title: string;
  category?: string | null;
}

export async function getSuggestions(
  q: string,
  limit?: number
): Promise<SuggestionItem[]> {
  const query = new URLSearchParams();
  query.set("q", q);
  if (limit) query.set("limit", String(limit));
  const res = await apiRequest<{ suggestions: SuggestionItem[] }>(
    `/v1/search/suggest?${query.toString()}`,
    { showLoader: false }
  );
  return res.suggestions;
}

// ---------------------------------------------------------------------------
// Trending
// ---------------------------------------------------------------------------

export async function getTrending(limit?: number): Promise<string[]> {
  const query = new URLSearchParams();
  if (limit) query.set("limit", String(limit));
  const res = await apiRequest<{ trending: string[] }>(
    `/v1/search/trending?${query.toString()}`,
    { showLoader: false }
  );
  return res.trending;
}

// ---------------------------------------------------------------------------
// Related Products
// ---------------------------------------------------------------------------

export interface RelatedProductItem {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  categoryId: string;
  sellerPrice: number;
  adminListingPrice: number | null;
  category: { id: string; name: string } | null;
}

export async function getRelatedProducts(
  productId: string,
  limit?: number
): Promise<RelatedProductItem[]> {
  const query = new URLSearchParams();
  if (limit) query.set("limit", String(limit));
  const res = await apiRequest<{ data: RelatedProductItem[] }>(
    `/v1/products/${productId}/related?${query.toString()}`,
    { showLoader: false }
  );
  return res.data;
}
