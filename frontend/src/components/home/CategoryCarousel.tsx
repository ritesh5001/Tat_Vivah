"use client";

import * as React from "react";
import Link from "next/link";
import { getCategories, type Category } from "@/services/catalog";
import { MotionCarousel } from "@/components/motion/MotionCarousel";
import { MotionCard } from "@/components/motion/MotionCard";

type CategoryItem = Category & {
  image?: string | null;
  imageUrl?: string | null;
};

function resolveCategoryImage(category: CategoryItem): string {
  const raw = category.imageUrl ?? category.image ?? "";
  if (!raw) return "/images/product-placeholder.svg";
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("https://ik.imagekit.io")) return raw;
  return "/images/product-placeholder.svg";
}

function CategorySkeletonCard() {
  return (
    <div className="snap-center shrink-0 w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] xl:w-[calc(20%-1.2rem)]">
      <div className="overflow-hidden rounded-none border border-border-soft bg-card shadow-sm">
        <div className="aspect-square w-full animate-pulse bg-muted" />
        <div className="p-3">
          <div className="h-4 w-3/4 animate-pulse rounded-none bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function CategoryCarousel() {
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visible, setVisible] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await getCategories();
        if (mounted) {
          setCategories((response.categories ?? []).filter((category) => category.isActive));
        }
      } catch {
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="categories"
      ref={sectionRef}
      className="border-t border-border-soft bg-cream/50 dark:bg-card/50"
    >
      <div
        className={`mx-auto max-w-6xl px-6 py-10 sm:py-12 lg:py-16 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="mb-10 text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold">
            Shop by Category
          </p>
          <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Curated Collections
          </h2>
        </div>

        {loading ? (
          <div className="flex gap-6 overflow-x-auto px-1 py-1 scrollbar-hide">
            {Array.from({ length: 5 }).map((_, index) => (
              <CategorySkeletonCard key={index} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-none border border-border-soft bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            Categories will be available soon.
          </div>
        ) : (
          <MotionCarousel>
            {categories.map((category) => (
              <Link key={category.id} href="/marketplace" className="contents">
                <MotionCard
                  imageSrc={resolveCategoryImage(category)}
                  imageAlt={category.name}
                  aspectClass="aspect-square"
                >
                  <div className="px-3 py-4 text-center">
                    <h3 className="line-clamp-2 font-serif text-base font-normal tracking-tight text-foreground transition-colors duration-300 group-hover:text-gold">
                      {category.name}
                    </h3>
                  </div>
                </MotionCard>
              </Link>
            ))}
          </MotionCarousel>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 border-b border-transparent pb-1 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-300 hover:border-gold hover:text-foreground"
          >
            View All Categories
            <span className="text-gold">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
