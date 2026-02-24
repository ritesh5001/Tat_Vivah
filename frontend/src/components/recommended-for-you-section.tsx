"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  fadeInVariants,
  staggerContainerVariants,
  staggerItemVariants,
  viewportSettings,
} from "@/lib/motion.config";
import { apiRequest } from "@/services/api";
import {
  MarketplaceProductCard,
  type MarketplaceCardProduct,
} from "@/components/marketplace-product-card";

interface RecommendationsResponse {
  products: Array<
    MarketplaceCardProduct & {
      recommendationScore: number;
    }
  >;
}

export function RecommendedForYouSection() {
  const [products, setProducts] = React.useState<RecommendationsResponse["products"]>([]);
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

    apiRequest<RecommendationsResponse>("/v1/personalization/recommendations", {
      method: "GET",
      showLoader: false,
    })
      .then((data) => {
        if (active) setProducts(data.products ?? []);
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
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section id="recommended" className="border-t border-border-soft">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
          variants={fadeInVariants}
          className="mb-16"
        >
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold mb-4">
            Personalized Picks
          </p>
          <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Recommended For You
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
          variants={staggerContainerVariants}
          className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
        >
          {products.slice(0, 6).map((product) => (
            <motion.div key={product.id} variants={staggerItemVariants}>
              <MarketplaceProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
