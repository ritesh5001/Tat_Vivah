"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  staggerContainerVariants,
  staggerItemVariants,
  fadeInVariants,
  viewportSettings,
} from "@/lib/motion.config";
import { apiRequest } from "@/services/api";
import { WishlistHeartButton } from "@/components/wishlist-heart-button";

interface RecentlyViewedProduct {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  sellerPrice: number;
  adminListingPrice: number | null;
  isPublished: boolean;
  category: { id: string; name: string } | null;
  viewedAt: number;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * Recently Viewed section for the homepage.
 * Only renders when the user is authenticated and has viewed products.
 */
export function RecentlyViewedSection() {
  const [products, setProducts] = React.useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    apiRequest<{ products: RecentlyViewedProduct[] }>(
      "/v1/personalization/recently-viewed",
      { showLoader: false }
    )
      .then((data) => {
        if (active) setProducts(data.products ?? []);
      })
      .catch(() => {
        // Not logged in or no data — hide section
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Hide section entirely when empty or when user is not authenticated
  if (!loading && products.length === 0) return null;

  // Also hide while loading to avoid layout shift for anonymous users
  if (loading) return null;

  return (
    <section className="border-t border-border-soft">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
          variants={fadeInVariants}
          className="mb-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold mb-4">
              Continue Exploring
            </p>
            <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Recently Viewed
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-300 hover:text-foreground border-b border-transparent hover:border-gold pb-1"
          >
            View All
            <span className="text-gold">→</span>
          </Link>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
          variants={staggerContainerVariants}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {products.slice(0, 8).map((product) => (
            <motion.div key={product.id} variants={staggerItemVariants}>
              <Link
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
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
