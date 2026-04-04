import Image from "next/image";
import Link from "next/link";
import { AnnouncementBar } from "@/components/announcement-bar";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Shop" },
];

function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/search" method="get" className={className}>
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
          type="search"
          name="q"
          placeholder="Search products..."
          className="h-10 w-full border border-border-soft bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20"
          autoComplete="off"
          aria-label="Search products"
        />
      </div>
    </form>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-border-soft bg-background/95 backdrop-blur-sm">
      <AnnouncementBar />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <details className="group sm:hidden">
          <summary className="flex h-14 list-none items-center">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-cream dark:hover:bg-brown/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 group-open:hidden"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="hidden h-5 w-5 group-open:block"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>

            <div className="flex-1 text-center">
              <Link href="/" className="inline-block">
                <Image
                  src="/logo.png"
                  alt="TatVivah Trends"
                  width={100}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            <Link
              href="/cart"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-cream dark:hover:bg-brown/50"
              aria-label="Cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </Link>
          </summary>

          <div className="pb-2">
            <SearchForm className="w-full" />
          </div>

          <div className="border-t border-border-soft py-3">
            <nav className="flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-3 text-sm font-medium text-foreground transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="py-3 text-sm font-medium text-foreground transition-colors hover:text-gold"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </details>

        <div className="hidden h-16 w-full items-center gap-8 sm:flex">
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.png"
              alt="TatVivah Trends"
              width={120}
              height={50}
              className="h-9 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative rounded-full px-4 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-cream hover:text-foreground dark:hover:bg-brown/40"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden flex-1 lg:block lg:max-w-md">
            <SearchForm className="w-full" />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/cart"
              className="relative hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-cream hover:text-foreground dark:hover:bg-brown/40 sm:inline-flex"
              aria-label="Cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </Link>

            <Link
              href="/login"
              className="hidden items-center rounded-full bg-charcoal px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-brown sm:inline-flex"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
