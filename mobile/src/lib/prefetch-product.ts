import type { QueryClient } from "@tanstack/react-query";
import { getProductById } from "../services/products";

/** Must match the queryKey/staleTime used by the product detail screen. */
export const PRODUCT_QUERY_STALE_TIME_MS = 10 * 60 * 1000;

/**
 * Warm the product detail cache the moment a card is tapped.
 *
 * Without this, the fetch only starts after the new screen has mounted and
 * rendered, so the buyer sees a spinner for a whole round-trip. Starting it at tap
 * time overlaps the request with the navigation animation, and because the key and
 * staleTime match the detail screen's own query, that screen simply reuses the
 * in-flight request rather than issuing a second one.
 *
 * Fire-and-forget by design: a failed prefetch must never block navigation — the
 * screen's own query will surface the error.
 */
export function prefetchProduct(queryClient: QueryClient, id: string): void {
  if (!id) return;

  void queryClient
    .prefetchQuery({
      queryKey: ["product", id],
      queryFn: ({ signal }: { signal?: AbortSignal }) => getProductById(id, signal),
      staleTime: PRODUCT_QUERY_STALE_TIME_MS,
    })
    .catch(() => undefined);
}
