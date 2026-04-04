"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const WeddingSectionBanner = dynamic(
  () => import("@/components/home/WeddingSectionBanner").then((m) => m.WeddingSectionBanner),
  { ssr: false, loading: () => <DeferredBlock className="h-[40vh] md:h-[52vh]" /> }
);

const ReviewSection = dynamic(
  () => import("@/components/review-section").then((m) => m.ReviewSection),
  { ssr: false, loading: () => <DeferredBlock className="h-64" /> }
);

const RecommendedForYouSection = dynamic(
  () => import("@/components/recommended-for-you-section").then((m) => m.RecommendedForYouSection),
  { ssr: false }
);

const RecentlyViewedSection = dynamic(
  () => import("@/components/recently-viewed-section").then((m) => m.RecentlyViewedSection),
  { ssr: false }
);

function DeferredBlock({ className }: { className: string }) {
  return (
    <div className={`mx-auto my-8 w-full max-w-6xl rounded border border-border-soft bg-card/40 animate-pulse ${className}`} />
  );
}

export function HomeDeferredSections() {
  const [enabled, setEnabled] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = triggerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setEnabled(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={triggerRef} aria-hidden="true" className="h-4 w-full" />

      {enabled ? (
        <>
          <WeddingSectionBanner />
          <RecommendedForYouSection />
          <RecentlyViewedSection />
          <ReviewSection />
        </>
      ) : (
        <>
          <DeferredBlock className="h-[34vh] md:h-[42vh]" />
          <DeferredBlock className="h-56" />
        </>
      )}
    </>
  );
}
