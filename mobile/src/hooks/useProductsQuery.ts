import { useQuery } from "@tanstack/react-query";
import { getProducts, type ProductListResponse } from "../services/products";

type UseProductsQueryParams = {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  sort?: string;
};

export function useProductsQuery({
  page = 1,
  limit = 10,
  categoryId,
  search,
  sort,
}: UseProductsQueryParams = {}) {
  return useQuery<ProductListResponse>({
    queryKey: ["products", { page, limit, categoryId, search, sort }],
    queryFn: ({ signal }) =>
      getProducts({
        page,
        limit,
        categoryId,
        search,
        sort,
        signal,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnReconnect: true,
    networkMode: "offlineFirst",
  });
}
