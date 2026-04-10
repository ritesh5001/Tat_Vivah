"use client";

import * as React from "react";
import Link from "next/link";
import {
  MarketplaceProductCard,
  type MarketplaceCardProduct,
} from "@/components/marketplace-product-card";

type ProductListResponse = {
  data?: MarketplaceCardProduct[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

const PAGE_SIZE = 8;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function mergeUniqueProducts(
  current: MarketplaceCardProduct[],
  incoming: MarketplaceCardProduct[]
): MarketplaceCardProduct[] {
  if (incoming.length === 0) return current;

  const seen = new Set(current.map((product) => product.id));
  const merged = [...current];

  for (const product of incoming) {
    if (!seen.has(product.id)) {
      merged.push(product);
      seen.add(product.id);
    }
  }

  return merged;
}

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-3/4 bg-cream dark:bg-brown/20" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-4/5 bg-cream dark:bg-brown/20" />
        <div className="h-2.5 w-2/5 bg-cream dark:bg-brown/20" />
        <div className="h-3 w-1/3 bg-cream dark:bg-brown/20" />
      </div>
    </div>
  );
}

export function InfiniteProductShowcaseSection({
  initialProducts,
}: {
  initialProducts?: MarketplaceCardProduct[];
}) {
  const initialVisibleProducts = React.useMemo(
    () => mergeUniqueProducts([], (initialProducts ?? []).slice(0, PAGE_SIZE)),
    [initialProducts]
  );

  const [products, setProducts] = React.useState<MarketplaceCardProduct[]>(
    initialVisibleProducts
  );
  const [page, setPage] = React.useState(initialVisibleProducts.length > 0 ? 1 : 0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(
    Boolean(API_BASE_URL) && initialVisibleProducts.length === PAGE_SIZE
  );
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const loadPage = React.useCallback(
    async (nextPage: number) => {
      if (!API_BASE_URL || isLoading || !hasMore) return;

      setIsLoading(true);
      setHasError(false);

      try {
        const query = new URLSearchParams({
          page: String(nextPage),
          limit: String(PAGE_SIZE),
          sort: "newest",
        });

        const response = await fetch(`${API_BASE_URL}/v1/products?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const payload = (await response.json()) as ProductListResponse;
        const incoming = Array.isArray(payload.data) ? payload.data : [];
        const totalPages = payload.pagination?.totalPages;

        setProducts((previous) => mergeUniqueProducts(previous, incoming));
        setPage(nextPage);

        const canLoadMore =
          typeof totalPages === "number"
            ? nextPage < totalPages
            : incoming.length === PAGE_SIZE;

        setHasMore(canLoadMore && incoming.length > 0);
      } catch {
        setHasError(true);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [hasMore, isLoading]
  );

  React.useEffect(() => {
    if (!API_BASE_URL) return;
    if (initialVisibleProducts.length > 0) return;

    setHasMore(true);
    void loadPage(1);
  }, [initialVisibleProducts.length, loadPage]);

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (!target?.isIntersecting || isLoading) return;
        void loadPage(page + 1);
      },
      {
        root: null,
        rootMargin: "900px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadPage, page]);

  return (
    <section id="product-showcase-infinite" className="border-t border-border-soft bg-cream/50 dark:bg-card/50">
      <div className="mx-auto max-w-460 px-3 py-12 sm:px-6 sm:py-20 lg:px-10">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-gold">Explore More</p>
          <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Product Showcase
          </h2>
        </div>

        <div className="px-0 sm:px-2">
          {products.length === 0 && !isLoading ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No products available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <MarketplaceProductCard key={product.id} product={product} />
              ))}

              {isLoading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <ProductCardSkeleton key={`product-skeleton-${index}`} />
                ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />

          {hasError ? (
            <p className="mt-6 text-center text-xs text-muted-foreground" role="status">
              Could not load more products right now.
            </p>
          ) : hasMore ? (
            <p className="mt-6 text-center text-xs text-muted-foreground" role="status">
              Scroll to load more products
            </p>
          ) : products.length > 0 ? (
            <p className="mt-6 text-center text-xs text-muted-foreground" role="status">
              You&apos;ve reached the end of the showcase.
            </p>
          ) : null}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-gold"
          >
            View All
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
