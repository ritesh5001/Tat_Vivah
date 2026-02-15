"use client";

import * as React from "react";
import Link from "next/link";
import { getRelatedProducts, type RelatedProductItem } from "@/services/search";
import { WishlistHeartButton } from "@/components/wishlist-heart-button";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group block"
            >
              <div className="relative mb-4 overflow-hidden bg-cream dark:bg-brown/20 aspect-3/4 border border-border-soft transition-all duration-400 group-hover:border-gold/30">
                <img
                  src={product.images?.[0] ?? "/images/product-placeholder.svg"}
                  alt={product.title}
                  className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground border border-border-soft">
                  {product.category?.name ?? "Featured"}
                </span>
                <WishlistHeartButton
                  productId={product.id}
                  size={16}
                  className="absolute bottom-3 right-3 h-7 w-7 bg-card/90 backdrop-blur-sm border border-border-soft text-muted-foreground hover:text-foreground hover:border-gold/50"
                />
              </div>
              <h3 className="font-serif text-sm font-normal text-foreground group-hover:text-gold transition-colors duration-300 line-clamp-2">
                {product.title}
              </h3>
              {typeof (product.adminListingPrice ?? product.sellerPrice) === "number" && (
                <p className="mt-1 text-xs font-medium text-foreground">
                  {currency.format(product.adminListingPrice ?? product.sellerPrice)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
