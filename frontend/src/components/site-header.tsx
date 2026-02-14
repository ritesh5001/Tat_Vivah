"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnnouncementBar } from "@/components/announcement-bar";

const buyerLinks = [
  { href: "/marketplace", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/#bestsellers", label: "Bestsellers" },
  { href: "/#new", label: "New" },
  { href: "/#gifting", label: "Gifting" },
  { href: "/vendors", label: "Vendors" },
  { href: "/cart", label: "Cart" },
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
    document.cookie = "tatvivah_access=; path=/; max-age=0";
    document.cookie = "tatvivah_role=; path=/; max-age=0";
    document.cookie = "tatvivah_user=; path=/; max-age=0";
    setUser(null);
    setMenuOpen(false);
    router.push("/login");
  };

  const displayName = user?.email ?? user?.phone ?? "Account";
  const initial = displayName?.charAt(0)?.toUpperCase() ?? "A";
  const role = user?.role?.toUpperCase();
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
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Image
              src="/tatvivah-logo.png"
              alt="TatVivah Trends"
              width={50}
              height={50}
              className="h-auto w-auto transition-transform duration-300 group-hover:scale-105"
              priority
              onError={() => console.warn("Logo image not found at /tatvivah-logo.png")}
            />
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="font-serif text-lg font-normal tracking-tight text-foreground">
              TatVivah
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Trends
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
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

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <ThemeToggle className="hidden sm:inline-flex" />

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border border-border-soft bg-card text-foreground transition-colors duration-300 hover:bg-cream dark:hover:bg-brown/50 sm:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="text-lg">{menuOpen ? "✕" : "☰"}</span>
          </button>

          {/* User Menu */}
          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-xs text-muted-foreground max-w-[120px] truncate">
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
                <DropdownMenuContent align="end" className="min-w-[160px]">
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
