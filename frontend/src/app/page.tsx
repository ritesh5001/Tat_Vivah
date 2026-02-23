"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  staggerContainerVariants,
  staggerItemVariants,
  fadeInVariants,
  viewportSettings
} from "@/lib/motion.config";
import { ReviewSection } from "@/components/review-section";
import { FeaturesMarquee } from "@/components/features-marquee";
import { getBestsellers, type BestsellerProduct } from "@/services/bestsellers";
import { RecommendedForYouSection } from "@/components/recommended-for-you-section";
import { RecentlyViewedSection } from "@/components/recently-viewed-section";
import { LuxuryHero } from "@/components/home/LuxuryHero";
import { WeddingSectionBanner } from "@/components/home/WeddingSectionBanner";
export default function Home() {
  const [bestsellers, setBestsellers] = React.useState<BestsellerProduct[]>([]);
  const [loadingBestsellers, setLoadingBestsellers] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await getBestsellers(4);
        if (isMounted) {
          setBestsellers(response.products ?? []);
        }
      } catch {
        if (isMounted) {
          setBestsellers([]);
        }
      } finally {
        if (isMounted) {
          setLoadingBestsellers(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatPrice = (price?: number | null) => {
    if (!price && price !== 0) return "Contact for price";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      {/* =========================================================================
          HERO SECTION - Luxury Carousel
          ========================================================================= */}
      <LuxuryHero />

      {/* =========================================================================
          FEATURES MARQUEE
          ========================================================================= */}
      <FeaturesMarquee />

      {/* =========================================================================
          CATEGORIES SECTION
          ========================================================================= */}
      <section id="categories" className="border-t border-border-soft bg-cream/50 dark:bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            variants={fadeInVariants}
            className="mb-16 text-center"
          >
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold mb-4">
              Shop by Category
            </p>
            <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Curated Collections
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            variants={staggerContainerVariants}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                name: "Wedding Sherwanis",
                desc: "Regal attire for the groom",
                image: "/SherwaniTatvivah.jpg",
              },
              {
                name: "Ethnic Kurtas",
                desc: "Traditional elegance",
                image: "/EthanicKurtaTatvivah.jpg",
              },
              {
                name: "Indo Western",
                desc: "Modern heritage fusion",
                image: "/IndoWesternTatvivah.jpg",
              },
              {
                name: "Accessories",
                desc: "Complete the look",
                image: "/Accesories.jpg",
              },
            ].map((category) => (
              <motion.div key={category.name} variants={staggerItemVariants}>
                <Link
                  href="/marketplace"
                  className="group flex flex-col items-center text-center"
                >
                  <div className="mb-5 h-56 w-56 overflow-hidden rounded-full border border-border-soft bg-cream dark:bg-brown/20 transition-all duration-400 group-hover:border-gold/40 group-hover:scale-[1.02]">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-serif text-xl font-normal text-foreground">
                    {category.name}
                  </h3>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            variants={fadeInVariants}
            className="mt-12 text-center"
          >
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-300 hover:text-foreground border-b border-transparent hover:border-gold pb-1"
            >
              View All Categories
              <span className="text-gold">→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          BESTSELLERS SECTION
          ========================================================================= */}
      <section id="bestsellers" className="border-t border-border-soft">
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
                Most Loved
              </p>
              <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
                Bestselling Pieces
              </h2>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-300 hover:text-foreground border-b border-transparent hover:border-gold pb-1"
            >
              Shop All
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
            {loadingBestsellers ? (
              <div className="col-span-full rounded-md border border-border-soft bg-card p-10 text-center text-sm text-muted-foreground">
                Loading bestsellers...
              </div>
            ) : bestsellers.length === 0 ? (
              <div className="col-span-full rounded-md border border-border-soft bg-card p-10 text-center text-sm text-muted-foreground">
                No bestsellers available yet.
              </div>
            ) : (
              bestsellers.map((item) => (
                <motion.div key={item.id} variants={staggerItemVariants}>
                  <Link href="/marketplace" className="group block">
                    {/* Product Image */}
                    <div className="relative mb-5 overflow-hidden bg-cream dark:bg-brown/20 aspect-[3/4]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                            Image
                          </span>
                        </div>
                      )}
                      {/* Tag */}
                      <span className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border border-border-soft">
                        Bestseller
                      </span>
                    </div>

                    {/* Product Info */}
                    <h3 className="font-serif text-base font-normal text-foreground mb-1 group-hover:text-gold transition-colors duration-300">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {formatPrice(item.salePrice ?? item.adminPrice ?? item.minPrice)}
                      </span>
                      {typeof item.regularPrice === "number" &&
                      typeof (item.salePrice ?? item.adminPrice ?? item.minPrice) === "number" &&
                      item.regularPrice !== (item.salePrice ?? item.adminPrice ?? item.minPrice) ? (
                        <span className="text-muted-foreground line-through">
                          {formatPrice(item.regularPrice)}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </section>

      <WeddingSectionBanner />

        <RecommendedForYouSection />

      {/* =========================================================================
          RECENTLY VIEWED SECTION (hidden if empty / not authenticated)
          ========================================================================= */}
      <RecentlyViewedSection />

      {/* =========================================================================
          NEW ARRIVALS SECTION
          ========================================================================= */}
      <section id="new" className="border-t border-border-soft bg-cream/50 dark:bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportSettings}
              variants={fadeInVariants}
              className="space-y-6"
            >
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
                New Arrivals
              </p>
              <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                The Heritage
                <br />
                <span className="italic">Collection</span>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground max-w-lg">
                Introducing our latest curation of handwoven masterpieces,
                each crafted by third-generation artisans from Varanasi and Lucknow.
                Limited edition pieces that celebrate India's textile heritage.
              </p>
              <div className="pt-4">
                <Link
                  href="/marketplace"
                  className="inline-flex h-12 items-center justify-center bg-charcoal px-8 text-xs font-medium uppercase tracking-[0.15em] text-ivory transition-all duration-400 hover:bg-brown dark:bg-gold dark:text-charcoal dark:hover:bg-gold-muted"
                >
                  Discover New Arrivals
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportSettings}
              variants={fadeInVariants}
              className="grid gap-4 grid-cols-2"
            >
              {["Modern Fusion", "Heritage Edit"].map((item) => (
                <div
                  key={item}
                  className="aspect-[3/4] bg-card border border-border-soft flex items-end p-6"
                >
                  <span className="font-serif text-sm text-foreground">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          REVIEW SECTION
          ========================================================================= */}
      <ReviewSection />

      {/* =========================================================================
          GIFTING SECTION
          ========================================================================= */}
      <section id="gifting" className="border-t border-border-soft">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            variants={staggerContainerVariants}
            className="grid gap-6 lg:grid-cols-3"
          >
            {/* Main Gifting Card */}
            <motion.div
              variants={staggerItemVariants}
              className="lg:col-span-2 border border-border-soft bg-card p-10 lg:p-12"
            >
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold mb-4">
                Thoughtful Gifting
              </p>
              <h3 className="font-serif text-2xl font-light tracking-tight text-foreground sm:text-3xl mb-4">
                Gift-Ready for Every Occasion
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                From weddings to festivals, our curated gift sets come in
                premium packaging with personalized notes. Every gift tells
                a story of heritage and care.
              </p>
            </motion.div>

            {/* Gift Card */}
            <motion.div
              variants={staggerItemVariants}
              className="border border-border-soft bg-cream dark:bg-brown/20 p-10 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold mb-4">
                  Gift Cards
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Let them choose their own piece of heritage with TatVivah gift cards.
                </p>
              </div>
              <Link
                href="/marketplace"
                className="inline-flex h-12 items-center justify-center bg-charcoal px-6 text-xs font-medium uppercase tracking-[0.15em] text-ivory transition-all duration-400 hover:bg-brown dark:bg-gold dark:text-charcoal dark:hover:bg-gold-muted w-full"
              >
                Purchase Gift Card
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          TRUST SECTION
          ========================================================================= */}
      <section className="border-t border-border-soft bg-cream/50 dark:bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            variants={staggerContainerVariants}
            className="grid gap-8 text-center sm:grid-cols-3"
          >
            {[
              { title: "Verified Artisans", desc: "Every seller is personally vetted" },
              { title: "Secure Payments", desc: "Protected by Razorpay" },
              { title: "Hassle-Free Returns", desc: "7-day easy returns" },
            ].map((item) => (
              <motion.div key={item.title} variants={staggerItemVariants}>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
