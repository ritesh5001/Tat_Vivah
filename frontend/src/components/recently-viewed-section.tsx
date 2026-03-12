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
import { MarketplaceProductCard } from "@/components/marketplace-product-card";

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

/**
 * Recently Viewed section for the homepage.
 * Only renders when the user is authenticated and has viewed products.
 */
export function RecentlyViewedSection() {
  const [products, setProducts] = React.useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    // Skip API call entirely for anonymous users — avoids 401 console noise
    const hasToken = typeof document !== "undefined" && document.cookie.includes("tatvivah_access=");
    if (!hasToken) {
      setProducts([]);
      setLoading(false);
      return;
    }

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
              <MarketplaceProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
