"use client";

import * as React from "react";
import Link from "next/link";
import { MarketplaceProductCard, type MarketplaceCardProduct } from "@/components/marketplace-product-card";
import { apiRequest } from "@/services/api";

type ProductsResponse = {
  data: MarketplaceCardProduct[];
  pagination: { total: number };
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ProductShowcaseSection() {
  const [products, setProducts] = React.useState<MarketplaceCardProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visible, setVisible] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const fetched = React.useRef(false);

  React.useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Fetch products when section becomes visible
  React.useEffect(() => {
    if (!visible || fetched.current) return;
    fetched.current = true;

    apiRequest<ProductsResponse>("/v1/products?page=1&limit=20", { method: "GET" })
      .then((res) => {
        const items = res?.data ?? [];
        setProducts(shuffle(items).slice(0, 8));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <section id="product-showcase" ref={sectionRef} className="border-t border-border-soft bg-cream/50 dark:bg-card/50">
      <div
        className={`mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-gold">Our Picks</p>
            <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">Product Showcase</h2>
          </div>
          <Link
            href="/marketplace"
            className="hidden text-[13px] font-medium text-muted-foreground transition-colors hover:text-gold sm:inline-flex items-center gap-1.5"
          >
            View All
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded bg-border-soft dark:bg-border" />
                <div className="mt-3 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-border-soft dark:bg-border" />
                  <div className="h-2.5 w-1/3 rounded bg-border-soft dark:bg-border" />
                  <div className="h-3 w-1/2 rounded bg-border-soft dark:bg-border" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No products available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <MarketplaceProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-gold"
          >
            View All Products
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
