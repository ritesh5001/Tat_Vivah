"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { getOccasions, type Occasion } from "@/services/occasions";

const LOOP_COPIES = 3;

function resolveOccasionImage(occasion: Occasion): string {
  const raw = occasion.image ?? "";
  if (!raw) return "/images/product-placeholder.svg";
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("https://ik.imagekit.io")) return raw;
  return "/images/product-placeholder.svg";
}

function OccasionSkeletonCard() {
  return (
    <div className="shrink-0 w-[calc((100%-2rem)/5)] md:w-[calc((100%-4.5rem)/7)] lg:w-[calc((100%-9rem)/10)]">
      <div className="relative aspect-square w-full animate-pulse overflow-hidden border border-[#dfd7cf] bg-[#e9e4de]" />
      <div className="mt-2 h-3 w-3/4 animate-pulse bg-[#ddd3ca] mx-auto" />
    </div>
  );
}

function OccasionCard({ occasion }: { occasion: Occasion }) {
  return (
    <div className="group shrink-0 w-[calc((100%-2rem)/5)] md:w-[calc((100%-4.5rem)/7)] lg:w-[calc((100%-9rem)/10)]">
      <div className="relative aspect-square w-full overflow-hidden border border-[#ddd2c6] bg-[#f5f1ec] transition-all duration-300 group-hover:border-[#b79b87]">
        <Image
          src={resolveOccasionImage(occasion)}
          alt={occasion.name}
          fill
          sizes="(max-width: 767px) 20vw, (max-width: 1023px) 14vw, 10vw"
          quality={75}
          loading="lazy"
          draggable={false}
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          style={{ objectPosition: "center 20%" }}
        />
      </div>
      <h3 className="mt-3 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-[#4f4741] sm:text-xs lg:text-sm">
        {occasion.name}
      </h3>
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

export function OccasionSection() {
  const [occasions, setOccasions] = React.useState<Occasion[]>([]);
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
  const rafRef = React.useRef<number>(0);
  const velocityRef = React.useRef({ lastX: 0, lastTime: 0, velocity: 0 });
  const scrollEndTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const loopingOccasions = React.useMemo(() => {
    if (occasions.length <= 1) {
      return occasions.map((occasion, index) => ({
        key: `${occasion.id}-0-${index}`,
        occasion,
      }));
    }

    return Array.from({ length: LOOP_COPIES }, (_, copyIndex) =>
      occasions.map((occasion, index) => ({
        key: `${occasion.id}-${copyIndex}-${index}`,
        occasion,
      }))
    ).flat();
  }, [occasions]);

  /* ── Data fetching ── */
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await getOccasions();
        if (mounted) setOccasions(res.occasions ?? []);
      } catch {
        if (mounted) setOccasions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
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
    const hasScrollableCarousel = occasions.length > 1;
    setCanScrollLeft(hasScrollableCarousel);
    setCanScrollRight(hasScrollableCarousel);
  }, [occasions.length]);

  const normalizeLoopPosition = React.useCallback(() => {
    const el = trackRef.current;
    if (!el || occasions.length <= 1) return;

    const segmentWidth = el.scrollWidth / LOOP_COPIES;
    if (!segmentWidth) return;

    if (el.scrollLeft < segmentWidth * 0.5) {
      el.scrollLeft += segmentWidth;
    } else if (el.scrollLeft > segmentWidth * 1.5) {
      el.scrollLeft -= segmentWidth;
    }
  }, [occasions.length]);

  const setLoopStartPosition = React.useCallback(() => {
    const el = trackRef.current;
    if (!el || occasions.length <= 1) return;

    const previousBehavior = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = el.scrollWidth / LOOP_COPIES;
    el.style.scrollBehavior = previousBehavior;
  }, [occasions.length]);

  React.useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateScrollButtons();

    const settleCarousel = () => {
      if (!dragStateRef.current.isDragging && !rafRef.current) {
        normalizeLoopPosition();
        el.style.scrollSnapType = "x mandatory";
      }
    };

    const handleScroll = () => {
      // Disable snap while actively scrolling to prevent jitter
      el.style.scrollSnapType = "none";

      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = setTimeout(settleCarousel, 150);
    };

    if (occasions.length > 1) {
      setLoopStartPosition();
      el.style.scrollSnapType = "x mandatory";
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollButtons);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
  }, [occasions, normalizeLoopPosition, setLoopStartPosition, updateScrollButtons]);

  React.useEffect(() => {
    const el = trackRef.current;
    if (!el || occasions.length <= 1) return;

    const resetToMiddle = () => {
      setLoopStartPosition();
      updateScrollButtons();
    };

    resetToMiddle();
    window.addEventListener("resize", resetToMiddle);

    return () => {
      window.removeEventListener("resize", resetToMiddle);
    };
  }, [occasions.length, setLoopStartPosition, updateScrollButtons]);

  const scroll = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(":scope > a > div")?.offsetWidth ?? 260;
    const gap = window.innerWidth >= 1024 ? 16 : window.innerWidth >= 768 ? 12 : 8;
    const distance = cardWidth + gap;
    el.scrollBy({ left: direction === "left" ? -distance : distance, behavior: "smooth" });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;

    event.preventDefault();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };

    velocityRef.current = { lastX: event.clientX, lastTime: performance.now(), velocity: 0 };

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

    const now = performance.now();
    const vRef = velocityRef.current;
    const dt = now - vRef.lastTime;
    if (dt > 0) {
      vRef.velocity = (event.clientX - vRef.lastX) / dt;
    }
    vRef.lastX = event.clientX;
    vRef.lastTime = now;

    el.scrollLeft = dragState.startScrollLeft - deltaX;
  };

  const endMouseDrag = () => {
    const el = trackRef.current;
    if (!el || !dragStateRef.current.isDragging) return;

    dragStateRef.current.isDragging = false;

    const velocity = velocityRef.current.velocity;

    // Apply momentum deceleration for a smooth glide effect
    if (Math.abs(velocity) > 0.3) {
      let v = velocity * 16;
      const friction = 0.95;

      const step = () => {
        v *= friction;
        if (Math.abs(v) < 0.5) {
          rafRef.current = 0;
          normalizeLoopPosition();
          el.style.scrollSnapType = "x mandatory";
          return;
        }
        el.scrollLeft -= v;
        rafRef.current = requestAnimationFrame(step);
      };

      rafRef.current = requestAnimationFrame(step);
    } else {
      normalizeLoopPosition();
      el.style.scrollSnapType = "x mandatory";
    }
  };

  const handleTrackClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragStateRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragStateRef.current.moved = false;
    }
  };

  if (!loading && occasions.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="border-t border-[#e9ddd3] bg-[#f3ede7]"
    >
      <div
        className={`mx-auto max-w-360 px-3 py-8 sm:px-6 sm:py-10 lg:px-8 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {loading ? (
          <div className="mx-auto flex max-w-330 gap-2 overflow-hidden px-1 md:gap-3 lg:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <OccasionSkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="relative mx-auto max-w-330 px-0 sm:px-10 lg:hidden">
              <div
                ref={trackRef}
                className="flex gap-2 overflow-x-auto px-0 py-2 scrollbar-hide select-none md:gap-3"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={endMouseDrag}
                onMouseLeave={endMouseDrag}
                onClickCapture={handleTrackClickCapture}
                style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain", willChange: "scroll-position" }}
              >
                {loopingOccasions.map(({ occasion, key }) => (
                  <Link key={key} href={`/marketplace?occasion=${occasion.slug}`} className="contents">
                    <OccasionCard occasion={occasion} />
                  </Link>
                ))}
              </div>

              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scroll("left")}
                  aria-label="Scroll occasions left"
                  className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#edd9cc] bg-[#faf6f1]/95 text-[#3d2a21] shadow-[0_10px_24px_rgba(129,91,69,0.14)] transition-all duration-200 hover:scale-105 hover:shadow-[0_14px_28px_rgba(129,91,69,0.18)] sm:left-0 sm:h-10 sm:w-10 sm:bg-[#faf6f1]"
                >
                  <ChevronIcon direction="left" />
                </button>
              )}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  aria-label="Scroll occasions right"
                  className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#edd9cc] bg-[#faf6f1]/95 text-[#3d2a21] shadow-[0_10px_24px_rgba(129,91,69,0.14)] transition-all duration-200 hover:scale-105 hover:shadow-[0_14px_28px_rgba(129,91,69,0.18)] sm:right-0 sm:h-10 sm:w-10 sm:bg-[#faf6f1]"
                >
                  <ChevronIcon direction="right" />
                </button>
              )}
            </div>

            <div className="mx-auto hidden max-w-330 grid-cols-10 gap-4 px-12 lg:grid">
              {occasions.map((occasion) => (
                <Link key={occasion.id} href={`/marketplace?occasion=${occasion.slug}`} className="contents">
                  <OccasionCard occasion={occasion} />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
