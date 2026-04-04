"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const LuxuryHero = dynamic(
  () => import("@/components/home/LuxuryHero").then((m) => m.LuxuryHero),
  { ssr: false }
);

export function HeroInteractiveLoader() {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const delay = window.innerWidth < 768 ? 2200 : 1400;
    let cancelled = false;

    const run = () => {
      if (!cancelled) {
        setEnabled(true);
      }
    };

    if ("requestIdleCallback" in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
        run,
        { timeout: delay }
      );
      return () => {
        cancelled = true;
        if ("cancelIdleCallback" in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }

    const timer = setTimeout(run, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-30">
      <LuxuryHero suppressAspect className="h-full" />
    </div>
  );
}
