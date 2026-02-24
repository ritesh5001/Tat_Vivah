"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/SearchBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnnouncementBar } from "@/components/announcement-bar";
import { getUnreadCount } from "@/services/notifications";
import { getWishlistCount } from "@/services/wishlist";
import { signOut } from "@/services/auth";

const buyerLinks = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Shop" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

const sellerLinks = [
  { href: "/seller/dashboard", label: "Overview" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/analytics", label: "Analytics" },
  { href: "/seller/payouts", label: "Payouts" },
  { href: "/seller/profile", label: "Profile" },
];

const adminLinks = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/bestsellers", label: "Bestsellers" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/security", label: "Security" },
  { href: "/admin/profile", label: "Profile" },
];

export function SiteHeader() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<{
    email?: string | null;
    phone?: string | null;
    role?: string | null;
  } | null>(null);

  React.useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(
        new RegExp(
          `(?:^|; )${name.replace(/([.$?*|{}()\[\]\\\/+^])/g, "\\$1")}=([^;]*)`
        )
      );
      return match ? decodeURIComponent(match[1]) : undefined;
    };

    const syncUser = () => {
      const storedUser = getCookie("tatvivah_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
        return;
      }
      setUser(null);
    };

    syncUser();

    const handleAuthChange = () => syncUser();
    window.addEventListener("tatvivah-auth", handleAuthChange);

    return () => {
      window.removeEventListener("tatvivah-auth", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    setUser(null);
    setMenuOpen(false);
    signOut();
  };

  const displayName = user?.email ?? user?.phone ?? "Account";
  const initial = displayName?.charAt(0)?.toUpperCase() ?? "A";
  const role = user?.role?.toUpperCase();

  const hasAccessToken = React.useMemo(() => {
    if (typeof document === "undefined") return false;
    return /(?:^|; )tatvivah_access=/.test(document.cookie);
  }, [user]);

  // Notification badge count
  const [unreadCount, setUnreadCount] = React.useState(0);
  // Wishlist badge count
  const [wishlistCount, setWishlistCount] = React.useState(0);
  React.useEffect(() => {
    // Only USER accounts have wishlist + notifications UI right now.
    // Also avoid calling auth endpoints when access token is missing.
    if (!user || role === "SELLER" || role === "ADMIN" || !hasAccessToken) {
      setUnreadCount(0);
      setWishlistCount(0);
      return;
    }
    let cancelled = false;
    getUnreadCount().then((count) => {
      if (!cancelled) setUnreadCount(count);
    });
    getWishlistCount()
      .then((res) => {
        if (!cancelled) setWishlistCount(res.count);
      })
      .catch(() => {});
    // Refresh every 60s while mounted
    const interval = setInterval(() => {
      getUnreadCount().then((count) => {
        if (!cancelled) setUnreadCount(count);
      });
      getWishlistCount()
        .then((res) => {
          if (!cancelled) setWishlistCount(res.count);
        })
        .catch(() => {});
    }, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [hasAccessToken, role, user]);
  const profileLink = React.useMemo(() => {
    if (role === "SELLER") {
      return "/seller/profile";
    }
    if (role === "ADMIN") {
      return "/admin/profile";
    }
    return "/user/profile";
  }, [role]);
  const navLinks = React.useMemo(() => {
    if (!user) {
      return buyerLinks;
    }

    if (role === "SELLER") {
      return sellerLinks;
    }

    if (role === "ADMIN") {
      return adminLinks;
    }

    return [
      ...buyerLinks,
      { href: "/user/dashboard", label: "Dashboard" },
      { href: "/user/orders", label: "Orders" },
    ];
  }, [role, user]);

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-border-soft bg-background/95 backdrop-blur-sm">
      <AnnouncementBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-4">
        {/* Mobile Header: menu left, logo center, cart right */}
        <div className="grid grid-cols-3 items-center sm:hidden">
          <div className="justify-self-start">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center border border-border-soft bg-card text-foreground transition-colors duration-300 hover:bg-cream dark:hover:bg-brown/50"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="text-lg">{menuOpen ? "✕" : "☰"}</span>
            </button>
          </div>

          <Link href="/" className="flex items-center justify-center gap-2 group justify-self-center">
            <Image
              src="/logo.png"
              alt="TatVivah Trends"
              width={120}
              height={50}
              className="h-auto w-auto transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </Link>

          <div className="justify-self-end">
            <Link
              href="/cart"
              className="inline-flex h-10 w-10 items-center justify-center border border-border-soft bg-card text-foreground transition-colors duration-300 hover:bg-cream dark:hover:bg-brown/50"
              aria-label="Cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.6 13.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mt-3 sm:hidden">
          <SearchBar placeholder="Search products..." className="w-full" />
        </div>

        {/* Desktop Header */}
        <div className="hidden w-full items-center justify-between sm:flex">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="TatVivah Trends"
              width={120}
              height={50}
              className="h-auto w-auto transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative py-1 transition-colors duration-300 hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block lg:w-[320px]">
            <SearchBar placeholder="Search products..." className="w-full" />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <ThemeToggle className="hidden sm:inline-flex" />

          {/* Wishlist Heart (visible when logged in as USER) */}
          {user && role !== "SELLER" && role !== "ADMIN" && (
            <Link
              href="/user/wishlist"
              className="relative hidden h-9 w-9 items-center justify-center border border-border-soft bg-card text-foreground transition-colors duration-300 hover:bg-cream dark:hover:bg-brown/50 sm:inline-flex"
              aria-label="Wishlist"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-charcoal leading-none">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
          )}

          {/* Notification Bell (visible when logged in as USER) */}
          {user && role !== "SELLER" && role !== "ADMIN" && (
            <Link
              href="/user/notifications"
              className="relative hidden h-9 w-9 items-center justify-center border border-border-soft bg-card text-foreground transition-colors duration-300 hover:bg-cream dark:hover:bg-brown/50 sm:inline-flex"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-charcoal leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User Menu */}
          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-xs text-muted-foreground max-w-30 truncate">
                {displayName}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center border border-border-soft bg-cream text-charcoal transition-all duration-300 hover:bg-charcoal hover:text-ivory dark:bg-brown dark:text-ivory dark:hover:bg-gold"
                    aria-label="Account menu"
                  >
                    <span className="font-serif text-sm">{initial}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                    Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={profileLink}>My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/login?force=1">Switch Account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:inline-flex">
              <Button size="sm" variant="primary">
                Sign In
              </Button>
            </Link>
          )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen ? (
        <div className="border-t border-border-soft bg-background px-6 py-6 sm:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-sm font-medium text-foreground border-b border-border-soft transition-colors hover:text-gold"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex items-center justify-between py-3 border-b border-border-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center bg-cream text-charcoal dark:bg-brown dark:text-ivory">
                  <span className="font-serif text-sm">{initial}</span>
                </div>
                <span className="text-sm text-foreground">{displayName}</span>
              </div>
              <ThemeToggle />
            </div>

            {user ? (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={profileLink}
                  className="py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  href="/login?force=1"
                  className="py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  Switch Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="py-2 text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="pt-2">
                <Button size="md" className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
