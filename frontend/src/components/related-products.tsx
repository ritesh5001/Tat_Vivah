"use client";

import * as React from "react";
import { getRelatedProducts, type RelatedProductItem } from "@/services/search";
import {
  MarketplaceProductCard,
} from "@/components/marketplace-product-card";

interface RelatedProductsProps {
  productId: string;
}

export function RelatedProducts({ productId }: RelatedProductsProps) {
  const [products, setProducts] = React.useState<RelatedProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    getRelatedProducts(productId, 8)
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="border-t border-border-soft pt-16">
      <div className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold mb-4">
          You May Also Like
        </p>
        <h2 className="font-serif text-2xl font-light text-foreground">
          Related Products
        </h2>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse space-y-3 border border-border-soft p-4"
            >
              <div className="aspect-3/4 bg-cream dark:bg-brown/20" />
              <div className="h-4 bg-cream dark:bg-brown/20 rounded w-3/4" />
              <div className="h-3 bg-cream dark:bg-brown/20 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {products.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
