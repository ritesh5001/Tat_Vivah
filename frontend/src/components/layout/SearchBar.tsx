"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchProducts, type SearchResultItem } from "@/services/search";

type SearchBarProps = {
  placeholder?: string;
  className?: string;
};

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
}: SearchBarProps) {
  const router = useRouter();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SearchResultItem[]>([]);

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
          onFocus={() => {
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
          placeholder={placeholder}
          className="h-10 w-full border border-border-soft bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20"
          aria-label="Search products"
          autoComplete="off"
        />

        {loading ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block h-4 w-4 animate-spin border-2 border-muted-foreground border-t-transparent" />
          </span>
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 border border-border-soft bg-card shadow-lg">
          {suggestions.length === 0 ? (
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
