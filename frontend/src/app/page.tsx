"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  staggerContainerVariants,
  staggerItemVariants,
  fadeInVariants,
  viewportSettings
} from "@/lib/motion.config";
import { getBestsellers, type BestsellerProduct } from "@/services/bestsellers";
import { LuxuryHero } from "@/components/home/LuxuryHero";
import { FeaturesMarquee } from "@/components/features-marquee";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { WishlistHeartButton } from "@/components/wishlist-heart-button";

/* ── Below-fold components loaded on demand to reduce initial JS ── */
const WeddingSectionBanner = dynamic(
  () => import("@/components/home/WeddingSectionBanner").then((m) => m.WeddingSectionBanner),
  { ssr: false },
);
const ReviewSection = dynamic(
  () => import("@/components/review-section").then((m) => m.ReviewSection),
  { ssr: false },
);
const RecommendedForYouSection = dynamic(
  () => import("@/components/recommended-for-you-section").then((m) => m.RecommendedForYouSection),
  { ssr: false },
);
const RecentlyViewedSection = dynamic(
  () => import("@/components/recently-viewed-section").then((m) => m.RecentlyViewedSection),
  { ssr: false },
);
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
      <CategoryCarousel />

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
              <div className="col-span-full rounded-none border border-border-soft bg-card p-10 text-center text-sm text-muted-foreground">
                Loading bestsellers...
              </div>
            ) : bestsellers.length === 0 ? (
              <div className="col-span-full rounded-none border border-border-soft bg-card p-10 text-center text-sm text-muted-foreground">
                No bestsellers available yet.
              </div>
            ) : (
              bestsellers.map((item) => (
                <motion.div key={item.id} variants={staggerItemVariants}>
                  <Link href="/marketplace" className="group block">
                    <div className="relative overflow-hidden bg-cream dark:bg-brown/20 aspect-3/4">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          loading="lazy"
                          quality={75}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                            Image
                          </span>
                        </div>
                      )}
                      <WishlistHeartButton
                        productId={item.productId}
                        size={18}
                        className="absolute left-4 top-4 h-10 w-10 rounded-none bg-card text-destructive shadow-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
                      />
                    </div>

                    <div className="pt-4 text-center">
                      <h3 className="line-clamp-2 font-serif text-[1.05rem] font-normal tracking-[0.01em] text-foreground transition-colors duration-300 group-hover:text-gold">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-xs uppercase tracking-[0.35em] text-muted-foreground/90">
                        {item.categoryName ?? "Tatvivah Curated"}
                      </p>
                      {typeof (item.salePrice ?? item.adminPrice ?? item.minPrice) === "number" ? (
                        <div className="mt-2 flex items-baseline justify-center gap-2">
                          <span className="text-3xl font-normal tracking-[0.01em] text-foreground">
                            {formatPrice(item.salePrice ?? item.adminPrice ?? item.minPrice)}
                          </span>
                          {typeof item.regularPrice === "number" &&
                          item.regularPrice > (item.salePrice ?? item.adminPrice ?? item.minPrice)! ? (
                            <span className="text-3xl font-normal text-muted-foreground/70 line-through">
                              {formatPrice(item.regularPrice)}
                            </span>
                          ) : null}
                          {typeof item.regularPrice === "number" &&
                          item.regularPrice > (item.salePrice ?? item.adminPrice ?? item.minPrice)! ? (
                            <span className="text-3xl font-normal text-destructive">
                              {Math.round(
                                ((item.regularPrice - (item.salePrice ?? item.adminPrice ?? item.minPrice)!) /
                                  item.regularPrice) *
                                  100
                              )}
                              % OFF
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">Contact for price</p>
                      )}
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
                  className="aspect-3/4 bg-card border border-border-soft flex items-end p-6"
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
        <div className="mx-auto max-w-6xl px-6 py-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            variants={staggerContainerVariants}
            className="grid grid-cols-3 gap-3 text-center sm:gap-6"
          >
            {[
              {
                title: "Verified Artisans",
                titleShort: "Verified",
                desc: "Every seller is personally vetted",
                descShort: "Seller vetted",
                icon: "shield",
              },
              {
                title: "Secure Payments",
                titleShort: "Payments",
                desc: "Protected by Razorpay",
                descShort: "Razorpay",
                icon: "lock",
              },
              {
                title: "Hassle-Free Returns",
                titleShort: "Returns",
                desc: "10-day easy returns",
                descShort: "10-day",
                icon: "refresh",
              },
            ].map((item) => (
              <motion.div key={item.title} variants={staggerItemVariants} className="px-1">
                <div className="mb-1.5 flex justify-center text-gold">
                  {item.icon === "shield" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                    >
                      <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  ) : item.icon === "lock" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                    >
                      <rect x="4" y="11" width="16" height="10" />
                      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                    >
                      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                      <path d="M21 3v6h-6" />
                    </svg>
                  )}
                </div>
                <h4 className="mb-0.5 text-[11px] font-medium leading-tight text-foreground sm:text-sm">
                  <span className="sm:hidden">{item.titleShort}</span>
                  <span className="hidden sm:inline">{item.title}</span>
                </h4>
                <p className="text-[10px] leading-tight text-muted-foreground sm:text-xs">
                  <span className="sm:hidden">{item.descShort}</span>
                  <span className="hidden sm:inline">{item.desc}</span>
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
