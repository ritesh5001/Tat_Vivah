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
];

const sellerLinks = [
  { href: "/seller/dashboard", label: "Overview" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/analytics", label: "Analytics" },
  { href: "/seller/settlements", label: "Payouts" },
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
    if (!user || role === "SELLER" || role === "ADMIN" || role === "SUPER_ADMIN" || !hasAccessToken) {
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
      .catch(() => { });
    // Refresh every 60s while mounted
    const interval = setInterval(() => {
      getUnreadCount().then((count) => {
        if (!cancelled) setUnreadCount(count);
      });
      getWishlistCount()
        .then((res) => {
          if (!cancelled) setWishlistCount(res.count);
        })
        .catch(() => { });
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
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
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

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
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
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Mobile Header: menu left, logo center, cart right */}
        <div className="flex h-14 items-center sm:hidden">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-cream dark:hover:bg-brown/50"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>
              )}
            </svg>
          </button>

          <div className="flex-1 flex justify-center">
            <Link href="/" className="group">
              <Image
                src="/logo.png"
                alt="TatVivah Trends"
                width={100}
                height={40}
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            {user && role !== "SELLER" && role !== "ADMIN" && role !== "SUPER_ADMIN" && (
              <Link
                href="/user/wishlist"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-cream dark:hover:bg-brown/50"
                aria-label="Wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-charcoal leading-none">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/cart"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-cream dark:hover:bg-brown/50"
              aria-label="Cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="pb-2 sm:hidden">
          <SearchBar placeholder="Search products..." className="w-full" />
        </div>

        {/* Desktop Header */}
        <div className="hidden h-16 w-full items-center gap-8 sm:flex">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group">
            <Image
              src="/logo.png"
              alt="TatVivah Trends"
              width={120}
              height={50}
              className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={link.href.startsWith("/admin") || link.href.startsWith("/seller") ? false : undefined}
                className="relative rounded-full px-4 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-cream hover:text-foreground dark:hover:bg-brown/40"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search - grows to fill available space */}
          <div className="hidden flex-1 lg:block lg:max-w-md">
            <SearchBar placeholder="Search products..." className="w-full" />
          </div>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle className="hidden sm:inline-flex" />

            {/* Wishlist (USER only) */}
            {user && role !== "SELLER" && role !== "ADMIN" && role !== "SUPER_ADMIN" && (
              <Link
                href="/user/wishlist"
                className="relative hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-cream hover:text-foreground dark:hover:bg-brown/40 sm:inline-flex"
                aria-label="Wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-charcoal leading-none">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notifications (USER only) */}
            {user && role !== "SELLER" && role !== "ADMIN" && role !== "SUPER_ADMIN" && (
              <Link
                href="/user/notifications"
                className="relative hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-cream hover:text-foreground dark:hover:bg-brown/40 sm:inline-flex"
                aria-label="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-charcoal leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart (USER only) */}
            {(!user || (role !== "SELLER" && role !== "ADMIN" && role !== "SUPER_ADMIN")) && (
              <Link
                href="/cart"
                className="relative hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-cream hover:text-foreground dark:hover:bg-brown/40 sm:inline-flex"
                aria-label="Cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </Link>
            )}

            {/* Divider */}
            {user && <div className="hidden h-6 w-px bg-border-soft sm:block" />}

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="hidden items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition-colors duration-200 hover:bg-cream dark:hover:bg-brown/40 sm:inline-flex"
                    aria-label="Account menu"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-ivory dark:bg-gold dark:text-charcoal">
                      <span className="font-serif text-sm font-medium">{initial}</span>
                    </div>
                    <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-foreground xl:block">
                      {displayName}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="hidden h-3.5 w-3.5 text-muted-foreground xl:block">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{role?.toLowerCase()} Account</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={profileLink} prefetch={false} className="gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/login?force=1" className="gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="M15 15 3 3" />
                      </svg>
                      Switch Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        <div className="border-t border-border-soft bg-background sm:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">
            {/* Nav Links */}
            <nav className="flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={link.href.startsWith("/admin") || link.href.startsWith("/seller") ? false : undefined}
                  className="flex items-center py-3 text-sm font-medium text-foreground transition-colors hover:text-gold"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="my-3 h-px bg-border-soft" />

            {user ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-ivory dark:bg-gold dark:text-charcoal">
                    <span className="font-serif text-sm font-medium">{initial}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{role?.toLowerCase()}</p>
                  </div>
                  <div className="ml-auto">
                    <ThemeToggle />
                  </div>
                </div>
                <Link
                  href={profileLink}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-cream hover:text-foreground dark:hover:bg-brown/30"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  My Profile
                </Link>
                <Link
                  href="/login?force=1"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-cream hover:text-foreground dark:hover:bg-brown/30"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="M15 15 3 3" />
                  </svg>
                  Switch Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <Button size="md" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
