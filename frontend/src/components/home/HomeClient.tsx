"use client";

import * as React from "react";
import Link from "next/link";
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
import { OccasionSection } from "@/components/home/OccasionSection";
import { ProductShowcaseSection } from "@/components/home/ProductShowcaseSection";
import { MarketplaceProductCard } from "@/components/marketplace-product-card";

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
export default function HomeClient() {
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
          SHOP BY OCCASION SECTION
          ========================================================================= */}
            <OccasionSection />

            {/* =========================================================================
          BESTSELLERS SECTION
          ========================================================================= */}
            <BestsellersCarousel
                bestsellers={bestsellers}
                loading={loadingBestsellers}
            />

            <ProductShowcaseSection />

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
                                Limited edition pieces that celebrate India&apos;s textile heritage.
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
          SEO INTERNAL LINKS SECTION
          ========================================================================= */}
            <section className="border-t border-border-soft bg-background">
                <div className="mx-auto max-w-6xl px-6 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div>
                            <h3 className="mb-6 font-serif text-xl tracking-wide text-foreground">Popular Collections</h3>
                            <ul className="space-y-3">
                                <li><Link href="/collections/kurta" className="text-sm text-muted-foreground hover:text-gold transition-colors">Men's Kurta Sets</Link></li>
                                <li><Link href="/collections/sherwani" className="text-sm text-muted-foreground hover:text-gold transition-colors">Wedding Sherwanis</Link></li>
                                <li><Link href="/collections/indo-western" className="text-sm text-muted-foreground hover:text-gold transition-colors">Indo-Western Outfits</Link></li>
                                <li><Link href="/collections/kurta-set" className="text-sm text-muted-foreground hover:text-gold transition-colors">Designer Kurta Pajama</Link></li>
                                <li><Link href="/collections/wedding" className="text-sm text-muted-foreground hover:text-gold transition-colors">Bridal & Groom Edit</Link></li>
                                <li><Link href="/collections/festive" className="text-sm text-muted-foreground hover:text-gold transition-colors">Festive Wear</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-6 font-serif text-xl tracking-wide text-foreground">Shop by Occasion</h3>
                            <ul className="space-y-3">
                                <li><Link href="/occasion/wedding" className="text-sm text-muted-foreground hover:text-gold transition-colors">Wedding Ceremonies</Link></li>
                                <li><Link href="/occasion/sangeet" className="text-sm text-muted-foreground hover:text-gold transition-colors">Sangeet Night</Link></li>
                                <li><Link href="/occasion/haldi" className="text-sm text-muted-foreground hover:text-gold transition-colors">Haldi Outfits</Link></li>
                                <li><Link href="/occasion/mehendi" className="text-sm text-muted-foreground hover:text-gold transition-colors">Mehendi Celebration</Link></li>
                                <li><Link href="/occasion/reception" className="text-sm text-muted-foreground hover:text-gold transition-colors">Reception Party</Link></li>
                                <li><Link href="/occasion/engagement" className="text-sm text-muted-foreground hover:text-gold transition-colors">Engagement Styles</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-6 font-serif text-xl tracking-wide text-foreground">From The Journal</h3>
                            <ul className="space-y-3">
                                <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-gold transition-colors">All Articles</Link></li>
                                <li><Link href="/blog/trending-wedding-outfits-for-men-2026" className="text-sm text-muted-foreground hover:text-gold transition-colors">Trending Wedding Outfits 2026</Link></li>
                                <li><Link href="/blog/how-to-style-kurta-pajama-for-haldi" className="text-sm text-muted-foreground hover:text-gold transition-colors">How to Style for Haldi</Link></li>
                            </ul>
                        </div>
                    </div>
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

/* ─────────────────────────────────────────────────────────────────────────────
   BESTSELLERS CAROUSEL — Manyavar-style horizontal scroll with arrows
   ───────────────────────────────────────────────────────────────────────────── */

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
        >
            {direction === "left" ? (
                <polyline points="15 18 9 12 15 6" />
            ) : (
                <polyline points="9 6 15 12 9 18" />
            )}
        </svg>
    );
}

function BestsellersCarousel({
    bestsellers,
    loading,
}: {
    bestsellers: BestsellerProduct[];
    loading: boolean;
}) {
    const trackRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);

    const updateArrows = React.useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);

    React.useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        updateArrows();
        el.addEventListener("scroll", updateArrows, { passive: true });
        window.addEventListener("resize", updateArrows);
        return () => {
            el.removeEventListener("scroll", updateArrows);
            window.removeEventListener("resize", updateArrows);
        };
    }, [updateArrows, bestsellers]);

    const scroll = (direction: "left" | "right") => {
        const el = trackRef.current;
        if (!el) return;
        const card = el.querySelector<HTMLElement>(":scope > div");
        const cardWidth = card?.offsetWidth ?? 260;
        const gap = 24;
        el.scrollBy({
            left: direction === "left" ? -(cardWidth + gap) : cardWidth + gap,
            behavior: "smooth",
        });
    };

    return (
        <section id="bestsellers" className="border-t border-border-soft">
            <div className="mx-auto max-w-460 px-3 py-16 sm:px-6 sm:py-20 lg:px-10">
                {/* Heading */}
                <div className="mb-12 text-center">
                    <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold">
                        Most Loved
                    </p>
                    <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
                        Bestselling Pieces
                    </h2>
                </div>

                {loading ? (
                    <div className="flex gap-6 overflow-hidden">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="shrink-0 w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]"
                            >
                                <div className="animate-pulse space-y-3">
                                    <div className="aspect-[3/4] bg-cream dark:bg-brown/20" />
                                    <div className="h-4 w-3/4 bg-cream dark:bg-brown/20 rounded" />
                                    <div className="h-3 w-1/2 bg-cream dark:bg-brown/20 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : bestsellers.length === 0 ? (
                    <div className="border border-border-soft bg-card p-10 text-center text-sm text-muted-foreground">
                        No bestsellers available yet.
                    </div>
                ) : (
                    <div className="relative px-0 sm:px-14 lg:px-16">
                        {/* Scrollable track */}
                        <div
                            ref={trackRef}
                            className="flex gap-6 overflow-x-auto snap-x snap-mandatory py-2 scrollbar-hide"
                            style={{ WebkitOverflowScrolling: "touch" }}
                        >
                            {bestsellers.map((item) => (
                                <div
                                    key={item.id}
                                    className="shrink-0 snap-start w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]"
                                >
                                    <MarketplaceProductCard
                                        product={{
                                            id: item.productId,
                                            productId: item.productId,
                                            title: item.title,
                                            image: item.image,
                                            categoryName: item.categoryName,
                                            salePrice: item.salePrice,
                                            adminPrice: item.adminPrice,
                                            regularPrice: item.regularPrice,
                                            minPrice: item.minPrice,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Arrow buttons */}
                        {canScrollLeft && (
                            <button
                                type="button"
                                onClick={() => scroll("left")}
                                aria-label="Scroll bestsellers left"
                                className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-border-soft bg-card/95 text-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md sm:h-12 sm:w-12"
                            >
                                <ChevronIcon direction="left" />
                            </button>
                        )}
                        {canScrollRight && (
                            <button
                                type="button"
                                onClick={() => scroll("right")}
                                aria-label="Scroll bestsellers right"
                                className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-border-soft bg-card/95 text-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md sm:h-12 sm:w-12"
                            >
                                <ChevronIcon direction="right" />
                            </button>
                        )}
                    </div>
                )}

                {/* Bottom CTA */}
                <div className="mt-12 text-center">
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center gap-2 border-b border-transparent pb-1 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-300 hover:border-gold hover:text-foreground"
                    >
                        Browse All Bestsellers
                        <span className="text-gold">→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
