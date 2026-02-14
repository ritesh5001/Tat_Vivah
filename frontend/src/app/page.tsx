"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  heroContainerVariants,
  heroItemVariants,
  staggerContainerVariants,
  staggerItemVariants,
  fadeInVariants,
  viewportSettings
} from "@/lib/motion.config";
import { ReviewSection } from "@/components/review-section";
import { FeaturesMarquee } from "@/components/features-marquee";
import { getBestsellers, type BestsellerProduct } from "@/services/bestsellers";

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
          HERO SECTION - Full Height, Cinematic
          ========================================================================= */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Subtle background pattern */}

        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(184,149,108,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(184,149,108,0.05),transparent_50%)]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={heroContainerVariants}
            className="space-y-8"
          >
            {/* Eyebrow */}
            <motion.p
              variants={heroItemVariants}
              className="text-xs font-medium uppercase tracking-[0.3em] text-gold"
            >
              Curated Men's Fashion
            </motion.p>

            {/* Main Heading */}
            <motion.h1
              variants={heroItemVariants}
              className="font-serif text-5xl font-light leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
            >
              The Art of
              <br />
              <span className="italic">Timeless</span> Elegance
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={heroItemVariants}
              className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Discover India's finest ethnic wear, handcrafted by artisans
              and curated for the modern gentleman. Every piece tells a story.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={heroItemVariants}
              className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-center"
            >
              <Link
                href="/marketplace"
                className="inline-flex h-14 items-center justify-center bg-charcoal px-10 text-xs font-medium uppercase tracking-[0.15em] text-ivory transition-all duration-400 hover:bg-brown dark:bg-gold dark:text-charcoal dark:hover:bg-gold-muted"
              >
                Explore Collection
              </Link>
              <Link
                href="/register/seller"
                className="inline-flex h-14 items-center justify-center border border-border-warm px-10 text-xs font-medium uppercase tracking-[0.15em] text-foreground transition-all duration-400 hover:bg-cream dark:hover:bg-brown/30"
              >
                Partner With Us
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={heroItemVariants}
              className="flex flex-wrap items-center justify-center gap-6 pt-8 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-gold" />
                Verified Artisans
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-gold" />
                Secure Checkout
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-gold" />
                Free Alterations
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
            <div className="h-8 w-px bg-border-warm" />
          </motion.div>
        </div>
      </section>

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
