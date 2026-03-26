"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const storageKey = "tatvivah-theme";

export function ThemeToggle({ className }: { className?: string }) {
  React.useEffect(() => {
    const root = document.documentElement;
    window.localStorage.setItem(storageKey, "dark");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }, []);

  return (
    <button
      type="button"
      className={cn(
        "h-9 w-9 flex items-center justify-center border border-border-soft bg-card text-muted-foreground transition-all duration-300 hover:bg-cream hover:text-foreground dark:hover:bg-brown/50",
        className
      )}
      aria-label="Dark mode enabled"
      title="Dark mode enabled"
      disabled
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z" />
      </svg>
    </button>
  );
}
