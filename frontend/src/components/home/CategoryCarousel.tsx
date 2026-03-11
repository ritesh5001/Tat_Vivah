"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategories, type Category } from "@/services/catalog";

const ARCH_RADIUS = "999px 999px 0 0 / 220px 220px 0 0";
const LOOP_COPIES = 3;

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
    <div className="shrink-0 w-[calc(50%-6px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-18px)]">
      <div
        className="relative w-full overflow-hidden border border-[#ead9cf] bg-muted"
        style={{ aspectRatio: "3 / 4", borderRadius: ARCH_RADIUS }}
      >
        <div className="absolute inset-0 animate-pulse bg-muted" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center p-5 sm:p-6">
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-300/50" />
        </div>
      </div>
    </div>
  );
}

/* ── Arrow icon (chevron) ── */
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

export function CategoryCarousel() {
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visible, setVisible] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const snapTypeRef = React.useRef<string | null>(null);
  const dragStateRef = React.useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });

  const loopingCategories = React.useMemo(() => {
    if (categories.length <= 1) {
      return categories.map((category, index) => ({
        key: `${category.id}-0-${index}`,
        category,
      }));
    }

    return Array.from({ length: LOOP_COPIES }, (_, copyIndex) =>
      categories.map((category, index) => ({
        key: `${category.id}-${copyIndex}-${index}`,
        category,
      }))
    ).flat();
  }, [categories]);

  /* ── Data fetching (unchanged) ── */
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

  /* ── Section reveal on viewport entry ── */
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

  /* ── Scroll state for arrow buttons ── */
  const updateScrollButtons = React.useCallback(() => {
    const hasScrollableCarousel = categories.length > 1;
    setCanScrollLeft(hasScrollableCarousel);
    setCanScrollRight(hasScrollableCarousel);
  }, [categories.length]);

  const normalizeLoopPosition = React.useCallback(() => {
    const el = trackRef.current;
    if (!el || categories.length <= 1) return;

    const segmentWidth = el.scrollWidth / LOOP_COPIES;
    if (!segmentWidth) return;

    if (el.scrollLeft < segmentWidth * 0.5) {
      el.scrollLeft += segmentWidth;
    } else if (el.scrollLeft > segmentWidth * 1.5) {
      el.scrollLeft -= segmentWidth;
    }
  }, [categories.length]);

  const setLoopStartPosition = React.useCallback(() => {
    const el = trackRef.current;
    if (!el || categories.length <= 1) return;

    const previousBehavior = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = el.scrollWidth / LOOP_COPIES;
    el.style.scrollBehavior = previousBehavior;
  }, [categories.length]);

  React.useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateScrollButtons();
    const handleScroll = () => {
      normalizeLoopPosition();
      updateScrollButtons();
    };

    if (categories.length > 1) {
      setLoopStartPosition();
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [categories, normalizeLoopPosition, setLoopStartPosition, updateScrollButtons]);

  React.useEffect(() => {
    const el = trackRef.current;
    if (!el || categories.length <= 1) return;

    const resetToMiddle = () => {
      setLoopStartPosition();
      updateScrollButtons();
    };

    resetToMiddle();
    window.addEventListener("resize", resetToMiddle);

    return () => {
      window.removeEventListener("resize", resetToMiddle);
    };
  }, [categories.length, setLoopStartPosition, updateScrollButtons]);

  const scroll = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(":scope > a > div")?.offsetWidth ?? 260;
    const gap = window.innerWidth >= 1024 ? 24 : window.innerWidth >= 768 ? 16 : 12;
    const distance = cardWidth + gap;
    el.scrollBy({ left: direction === "left" ? -distance : distance, behavior: "smooth" });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;

    event.preventDefault();

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };

    snapTypeRef.current = el.style.scrollSnapType;
    el.style.scrollSnapType = "none";
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    const dragState = dragStateRef.current;
    if (!el || !dragState.isDragging) return;

    event.preventDefault();

    const deltaX = event.clientX - dragState.startX;
    if (Math.abs(deltaX) > 4) {
      dragState.moved = true;
    }

    el.scrollLeft = dragState.startScrollLeft - deltaX;
  };

  const endMouseDrag = () => {
    const el = trackRef.current;
    if (!el) return;

    if (snapTypeRef.current !== null) {
      el.style.scrollSnapType = snapTypeRef.current;
      snapTypeRef.current = null;
    } else {
      el.style.scrollSnapType = "";
    }

    dragStateRef.current.isDragging = false;
    normalizeLoopPosition();
  };

  const handleTrackClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragStateRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragStateRef.current.moved = false;
    }
  };

  return (
    <section
      id="categories"
      ref={sectionRef}
      className="border-t border-[#e9ddd3] bg-[#f3ede7]"
    >
      <div
        className={`mx-auto max-w-460 px-3 py-16 sm:px-6 sm:py-20 lg:px-10 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="mb-12 text-center">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.34em] text-[#a07a63]">
            Shop by Category
          </p>
          <h2 className="font-serif text-3xl font-light tracking-[0.02em] text-[#34231b] sm:text-4xl">
            Curated Collections
          </h2>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden px-1 md:gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CategorySkeletonCard key={i} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded border border-[#e1d3c8] bg-white/70 px-6 py-10 text-center text-sm text-[#7a675c]">
            Categories will be available soon.
          </div>
        ) : (
          <div className="relative px-0 sm:px-14 lg:px-16">
            <div
              ref={trackRef}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-0 py-2 scrollbar-hide select-none md:gap-4 lg:gap-6"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={endMouseDrag}
              onMouseLeave={endMouseDrag}
              onClickCapture={handleTrackClickCapture}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {loopingCategories.map(({ category, key }) => (
                <Link key={key} href="/marketplace" className="contents">
                  <div className="group shrink-0 snap-start w-[calc(50%-6px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-18px)]">
                    <div
                      className="relative w-full overflow-hidden border border-[#e8d6cb] bg-[#ebe1d7] shadow-[0_14px_30px_rgba(94,64,43,0.06)]"
                      style={{ aspectRatio: "3 / 4", borderRadius: ARCH_RADIUS }}
                    >
                      <Image
                        src={resolveCategoryImage(category)}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        quality={75}
                        loading="lazy"
                        draggable={false}
                        className="object-cover transition-transform duration-400 ease-out group-hover:scale-105"
                        style={{ objectPosition: "center top" }}
                      />

                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(69,32,18,0.72) 0%, rgba(69,32,18,0.34) 20%, rgba(69,32,18,0.08) 38%, transparent 60%)",
                        }}
                      />

                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center px-4 pb-4 pt-16 sm:px-5 sm:pb-5 lg:pb-6">
                        <h3 className="text-center font-serif text-base font-normal uppercase tracking-[0.08em] text-[#fff9f5] drop-shadow-[0_2px_10px_rgba(0,0,0,0.32)] sm:text-[2rem] sm:leading-none lg:text-[2.15rem]">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="Scroll categories left"
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#edd9cc] bg-[#faf6f1]/95 text-[#3d2a21] shadow-[0_10px_24px_rgba(129,91,69,0.14)] transition-all duration-200 hover:scale-105 hover:shadow-[0_14px_28px_rgba(129,91,69,0.18)] sm:left-0 sm:h-13 sm:w-13 sm:bg-[#faf6f1]"
              >
                <ChevronIcon direction="left" />
              </button>
            )}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="Scroll categories right"
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#edd9cc] bg-[#faf6f1]/95 text-[#3d2a21] shadow-[0_10px_24px_rgba(129,91,69,0.14)] transition-all duration-200 hover:scale-105 hover:shadow-[0_14px_28px_rgba(129,91,69,0.18)] sm:right-0 sm:h-13 sm:w-13 sm:bg-[#faf6f1]"
              >
                <ChevronIcon direction="right" />
              </button>
            )}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 border-b border-transparent pb-1 text-xs font-medium uppercase tracking-[0.15em] text-[#7f6859] transition-colors duration-300 hover:border-[#b2886d] hover:text-[#3d2a21]"
          >
            View All Categories
            <span className="text-[#b2886d]">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
