"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { searchProducts, type SearchResultItem } from "@/services/search";
import { getCategories } from "@/services/catalog";

type SearchBarProps = {
  placeholder?: string;
  className?: string;
  rotatingPhrases?: string[];
};

const DEFAULT_ROTATING_PHRASES = [
  "Search festive",
  "Search haldi",
  "Search mehendi",
  "Search sangeet",
  "Search reception",
  "Search wedding",
  "Search cocktail",
  "Search engagement",
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function resolvePrice(item: SearchResultItem): number | null {
  const price = item.adminListingPrice;
  return typeof price === "number" ? price : null;
}

export function SearchBar({
  placeholder = "Search products...",
  className,
  rotatingPhrases = DEFAULT_ROTATING_PHRASES,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const [query, setQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SearchResultItem[]>([]);
  const [categorySuggestions, setCategorySuggestions] = React.useState<string[]>([]);

  const urlSearchTerm = React.useMemo(() => {
    const q = searchParams.get("q")?.trim();
    const search = searchParams.get("search")?.trim();
    return q || search || "";
  }, [searchParams]);

  React.useEffect(() => {
    setQuery(urlSearchTerm);
    setOpen(false);
  }, [urlSearchTerm]);

  React.useEffect(() => {
    let mounted = true;

    getCategories()
      .then((res) => {
        if (!mounted) return;
        const names = (res?.categories ?? [])
          .filter((category) => category.isActive)
          .slice(0, 8)
          .map((category) => category.name);
        setCategorySuggestions(names);
      })
      .catch(() => {
        if (mounted) setCategorySuggestions([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (rotatingPhrases.length <= 1) return;

    const interval = window.setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, [rotatingPhrases]);

  const runSearch = React.useCallback(async (value: string) => {
    const trimmed = value.trim();

    if (trimmed.length < 1) {
      abortRef.current?.abort();
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const response = await searchProducts({
        q: trimmed,
        page: 1,
        limit: 5,
        signal: controller.signal,
      });
      setSuggestions(response.data ?? []);
      setOpen(true);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setSuggestions([]);
        setOpen(false);
      }
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const submitQuery = React.useCallback(
    (value?: string) => {
      const term = (value ?? query).trim();
      if (!term) return;
      const params = new URLSearchParams();
      params.set("q", term);
      setOpen(false);
      router.push(`/search?${params.toString()}`);
    },
    [query, router]
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(value);
    }, 400);
  };

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>

        <input
          type="text"
          value={query}
          onChange={handleChange}
          onBlur={() => setIsFocused(false)}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim().length === 0) {
              if (categorySuggestions.length > 0) setOpen(true);
              return;
            }
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitQuery();
            }
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={isFocused ? placeholder : ""}
          className="h-10 w-full border border-border-soft bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20"
          aria-label="Search products"
          autoComplete="off"
        />

        {!query && !isFocused ? (
          <div className="pointer-events-none absolute inset-y-0 left-10 right-10 flex items-center overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={rotatingPhrases[phraseIndex]}
                initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="truncate text-sm text-muted-foreground/90"
              >
                {rotatingPhrases[phraseIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        ) : null}

        {loading ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block h-4 w-4 animate-spin border-2 border-muted-foreground border-t-transparent" />
          </span>
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 border border-border-soft bg-card shadow-lg">
          {query.trim().length === 0 ? (
            <div className="px-4 py-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
                Search by category
              </p>
              {categorySuggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Type to search products...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categorySuggestions.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => submitQuery(category)}
                      className="inline-flex items-center gap-1 border border-border-soft bg-background px-3 py-1.5 text-xs font-medium tracking-[0.06em] text-foreground transition-colors hover:bg-cream hover:text-gold dark:hover:bg-brown/20"
                    >
                      <span className="text-gold/80">✿</span>
                      <span>Search {category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No products found.</div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {suggestions.map((item) => {
                const image = item.images?.[0] ?? "/images/product-placeholder.svg";
                const price = resolvePrice(item);
                return (
                  <li key={item.id}>
                    <Link
                      href={`/product/${item.id}`}
                      onClick={() => setOpen(false)}
                      className="grid grid-cols-[56px_1fr] gap-3 px-3 py-3 transition-colors duration-200 hover:bg-cream dark:hover:bg-brown/20"
                    >
                      <div className="relative h-14 w-14 overflow-hidden border border-border-soft bg-cream dark:bg-brown/20">
                        <Image
                          src={image}
                          alt={item.title}
                          fill
                          sizes="56px"
                          quality={70}
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {price !== null ? currency.format(price) : "Price on request"}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}

              <li className="border-t border-border-soft">
                <button
                  type="button"
                  onClick={() => submitQuery()}
                  className="w-full px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-200 hover:bg-cream hover:text-foreground dark:hover:bg-brown/20"
                >
                  View all results
                </button>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
