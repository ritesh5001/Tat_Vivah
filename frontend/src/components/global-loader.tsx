"use client";

import * as React from "react";

export function GlobalLoader() {
  const [count, setCount] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const showTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const handleStart = () => setCount((prev) => prev + 1);
    const handleEnd = () =>
      setCount((prev) => (prev > 0 ? prev - 1 : 0));

    window.addEventListener("tv-global-loading-start", handleStart);
    window.addEventListener("tv-global-loading-end", handleEnd);

    return () => {
      window.removeEventListener("tv-global-loading-start", handleStart);
      window.removeEventListener("tv-global-loading-end", handleEnd);
    };
  }, []);

  React.useEffect(() => {
    if (count > 0) {
      if (showTimer.current) return;
      showTimer.current = setTimeout(() => {
        showTimer.current = null;
        setVisible(true);
      }, 300);
      return;
    }

    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    setVisible(false);
  }, [count]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 border border-border-soft bg-card px-10 py-8">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center border border-border-warm bg-cream text-charcoal dark:bg-brown dark:text-ivory">
            <span className="font-serif text-xl font-light">T</span>
          </div>
          <div>
            <p className="font-serif text-base font-normal text-foreground">
              TatVivah
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Processing...
            </p>
          </div>
        </div>

        {/* Progress Bar - Using Tailwind animation */}
        <div className="h-px w-48 bg-border-soft overflow-hidden">
          <div className="h-full w-1/2 bg-gold animate-pulse" />
        </div>
      </div>
    </div>
  );
}
