"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAVIGATION_START_EVENT } from "@/lib/navigation-feedback";

const COMPLETE_DELAY_MS = 170;
const FAILSAFE_TIMEOUT_MS = 10000;
const OVERLAY_DELAY_MS = 220;

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = React.useState(false);
  const [overlayVisible, setOverlayVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const completeTimeoutRef = React.useRef<number | null>(null);
  const failsafeRef = React.useRef<number | null>(null);
  const tickRef = React.useRef<number | null>(null);
  const overlayDelayRef = React.useRef<number | null>(null);

  const clearTimers = React.useCallback(() => {
    if (completeTimeoutRef.current) {
      window.clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }
    if (failsafeRef.current) {
      window.clearTimeout(failsafeRef.current);
      failsafeRef.current = null;
    }
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (overlayDelayRef.current) {
      window.clearTimeout(overlayDelayRef.current);
      overlayDelayRef.current = null;
    }
  }, []);

  const begin = React.useCallback(() => {
    clearTimers();
    setVisible(true);
    setOverlayVisible(false);
    setProgress(14);

    // Animate quickly to indicate immediate reaction, then crawl.
    window.requestAnimationFrame(() => setProgress(46));

    tickRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return prev;
        return prev + 4;
      });
    }, 220);

    overlayDelayRef.current = window.setTimeout(() => {
      setOverlayVisible(true);
    }, OVERLAY_DELAY_MS);

    failsafeRef.current = window.setTimeout(() => {
      setVisible(false);
      setOverlayVisible(false);
      setProgress(0);
      clearTimers();
    }, FAILSAFE_TIMEOUT_MS);
  }, [clearTimers]);

  const finish = React.useCallback(() => {
    setProgress(100);
    setOverlayVisible(false);
    clearTimers();
    completeTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, COMPLETE_DELAY_MS);
  }, [clearTimers]);

  React.useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const currentPath = `${window.location.pathname}${window.location.search}`;
      const nextPath = `${nextUrl.pathname}${nextUrl.search}`;
      if (currentPath === nextPath) return;

      begin();
    };

    window.addEventListener("click", onClickCapture, true);
    window.addEventListener(NAVIGATION_START_EVENT, begin);

    return () => {
      window.removeEventListener("click", onClickCapture, true);
      window.removeEventListener(NAVIGATION_START_EVENT, begin);
      clearTimers();
    };
  }, [begin, clearTimers]);

  React.useEffect(() => {
    if (visible) {
      finish();
    }
    // Route/search change means navigation has completed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed left-0 right-0 top-0 z-120 h-0.75 transition-opacity duration-150 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="h-full bg-gold shadow-[0_0_12px_rgba(183,149,108,0.55)] transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-110 transition-opacity duration-200 ${
          overlayVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-background/20 backdrop-blur-sm" />
        <div className="absolute left-1/2 top-1/2 w-[min(92vw,340px)] -translate-x-1/2 -translate-y-1/2 border border-border-soft bg-card/95 px-5 py-4 shadow-[0_10px_40px_rgba(44,40,37,0.14)]">
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full border-2 border-gold/25 border-t-gold animate-spin" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gold">Please Wait</p>
              <p className="truncate text-sm text-foreground">Preparing your next view</p>
            </div>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden bg-cream dark:bg-brown/25">
            <div className="h-full w-1/2 animate-pulse bg-gold/70" />
          </div>
        </div>
      </div>
    </>
  );
}