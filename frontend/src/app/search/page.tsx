"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MarketplaceProductCard, type MarketplaceCardProduct } from "@/components/marketplace-product-card";
import { Button } from "@/components/ui/button";
import { searchProducts, type SearchResultItem } from "@/services/search";

type SearchPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function toMarketplaceCardProduct(item: SearchResultItem): MarketplaceCardProduct {
  return {
    id: item.id,
    title: item.title,
    images: item.images,
    category: item.category,
    adminListingPrice: item.adminListingPrice,
  };
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<MarketplaceCardProduct[]>([]);
  const [pagination, setPagination] = React.useState<SearchPagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  React.useEffect(() => {
    const controller = new AbortController();

    if (!query) {
      setItems([]);
      setPagination({ page: 1, limit: 12, total: 0, totalPages: 1 });
      return () => controller.abort();
    }

    setLoading(true);
    searchProducts({ q: query, page, limit: 12, signal: controller.signal })
      .then((res) => {
        setItems((res.data ?? []).map(toMarketplaceCardProduct));
        setPagination(res.pagination ?? { page, limit: 12, total: 0, totalPages: 1 });
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setItems([]);
          setPagination({ page, limit: 12, total: 0, totalPages: 1 });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, query]);

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(nextPage));
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Search</p>
          <h1 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Showing results for: {query || "—"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Searching..." : `${pagination.total} result${pagination.total === 1 ? "" : "s"}`}
          </p>
        </div>

        {!query ? (
          <div className="border border-border-soft bg-card p-10 text-center text-sm text-muted-foreground">
            Enter a keyword in search to find products.
          </div>
        ) : loading ? (
          <div className="border border-border-soft bg-card p-10 text-center text-sm text-muted-foreground">
            Loading search results...
          </div>
        ) : items.length === 0 ? (
          <div className="border border-border-soft bg-card p-10 text-center text-sm text-muted-foreground">
            No results found for "{query}".
          </div>
        ) : (
          <>
            <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((product) => (
                <MarketplaceProductCard key={product.id} product={product} />
              ))}
            </section>

            <section className="mt-12 flex items-center justify-between border-t border-border-soft pt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(Math.max(pagination.page - 1, 1))}
              >
                ← Previous
              </Button>

              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(Math.min(pagination.page + 1, pagination.totalPages))}
              >
                Next →
              </Button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={null}>
      <SearchContent />
    </React.Suspense>
  );
}
