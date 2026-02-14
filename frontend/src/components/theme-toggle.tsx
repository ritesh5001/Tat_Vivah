"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const storageKey = "tatvivah-theme";

type ThemeMode = "light" | "dark";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.style.colorScheme = theme;
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<ThemeMode>("light");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(storageKey) as ThemeMode | null;
    const initial = stored ?? "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(storageKey, next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "h-9 w-9 flex items-center justify-center border border-border-soft bg-card text-muted-foreground transition-all duration-300 hover:bg-cream hover:text-foreground dark:hover:bg-brown/50",
        className
      )}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
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
      ) : (
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
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}
