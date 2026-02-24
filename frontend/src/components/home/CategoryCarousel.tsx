"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategories, type Category } from "@/services/catalog";

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
    <div className="snap-center shrink-0 w-[calc(50%-0.5rem)] md:w-[calc((100%-1rem)/3)] xl:w-[calc((100%-3.2rem)/5)]">
      <div className="overflow-hidden rounded-xl border border-border-soft bg-card shadow-sm">
        <div className="aspect-square w-full animate-pulse bg-muted" />
        <div className="p-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
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
        className={`mx-auto max-w-6xl px-6 py-24 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="mb-12 text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold">
            Shop by Category
          </p>
          <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Curated Collections
          </h2>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-x-auto px-1 py-1 scrollbar-hide">
            {Array.from({ length: 5 }).map((_, index) => (
              <CategorySkeletonCard key={index} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-xl border border-border-soft bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            Categories will be available soon.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-1 py-1 scrollbar-hide">
            {categories.map((category) => (
              <Link
                key={category.id}
                href="/marketplace"
                className="group snap-center shrink-0 w-[calc(50%-0.5rem)] md:w-[calc((100%-1rem)/3)] xl:w-[calc((100%-3.2rem)/5)]"
              >
                <article className="overflow-hidden rounded-xl border border-border-soft bg-card shadow-sm transition-all duration-300 group-hover:shadow-md">
                  <div className="relative aspect-square w-full overflow-hidden bg-cream dark:bg-brown/20">
                    <Image
                      src={resolveCategoryImage(category)}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                      quality={70}
                      loading="lazy"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-3 py-4 text-center">
                    <h3 className="line-clamp-2 font-serif text-base font-normal tracking-tight text-foreground">
                      {category.name}
                    </h3>
                  </div>
                </article>
              </Link>
            ))}
          </div>
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
