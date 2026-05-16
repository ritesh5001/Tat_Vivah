"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MarketplaceProductCard,
  type MarketplaceCardProduct,
} from "@/components/marketplace-product-card";
import { AudienceTabs, type Audience } from "@/components/home/AudienceTabs";

interface NewArrivalsSectionProps {
  mensProducts: MarketplaceCardProduct[];
  kidsProducts: MarketplaceCardProduct[];
}

export function NewArrivalsSection({
  mensProducts,
  kidsProducts,
}: NewArrivalsSectionProps) {
  const [audience, setAudience] = useState<Audience>("MENS");
  const products = audience === "MENS" ? mensProducts : kidsProducts;

  return (
    <section id="new" className="border-t border-border-soft bg-cream/50 dark:bg-card/50">
      <div className="mx-auto max-w-460 px-3 py-12 sm:px-6 sm:py-20 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6 px-0 sm:px-2">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
              New Arrivals
            </p>
            <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              The Heritage
              <br />
              <span className="italic">Collection</span>
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
              Introducing our latest curation of handwoven masterpieces,
              each crafted by third-generation artisans from Varanasi and Lucknow.
              Limited edition pieces that celebrate India&apos;s textile heritage.
            </p>
            <div className="pt-2">
              <AudienceTabs value={audience} onChange={setAudience} />
            </div>
            <div className="pt-4">
              <Link
                href="/marketplace"
                className="inline-flex h-12 items-center justify-center bg-charcoal px-8 text-xs font-medium uppercase tracking-[0.15em] text-ivory transition-all duration-400 hover:bg-brown dark:bg-gold dark:text-charcoal dark:hover:bg-gold-muted"
              >
                Discover New Arrivals
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 px-0 sm:px-2">
            {products.length > 0 ? (
              products.map((product) => (
                <MarketplaceProductCard key={product.id} product={product} />
              ))
            ) : (
              ["Modern Fusion", "Heritage Edit"].map((item) => (
                <div
                  key={item}
                  className="flex aspect-3/4 items-end border border-border-soft bg-card p-6"
                >
                  <span className="font-serif text-sm text-foreground">{item}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
