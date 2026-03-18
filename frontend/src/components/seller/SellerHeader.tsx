"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/services/auth";
import { getUnreadCount } from "@/services/notifications";

export function SellerHeader() {
  const pathname = usePathname();
  const [unread, setUnread] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;
    getUnreadCount().then((c) => {
      if (mounted) setUnread(c);
    });
    const interval = setInterval(() => {
      getUnreadCount().then((c) => {
        if (mounted) setUnread(c);
      });
    }, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { href: "/seller/dashboard", label: "Dashboard" },
    { href: "/seller/products", label: "Products" },
    { href: "/seller/reels", label: "Reels" },
    { href: "/seller/orders", label: "Orders" },
    { href: "/seller/appointments", label: "Appointments" },
    { href: "/seller/settlements", label: "Settlements" },
    { href: "/seller/analytics", label: "Analytics" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-background">
      <div className="mx-auto flex h-16 w-full max-w-400 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-7 w-1 bg-gold" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">TatVivah</p>
            <p className="text-sm font-semibold tracking-[0.08em] text-foreground">Seller Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-9 items-center border px-4 text-xs font-medium uppercase tracking-[0.12em] transition-colors ${
                  isActive
                    ? "border-gold/40 bg-gold/5 text-foreground"
                    : "border-border-soft text-foreground hover:bg-cream"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/seller/notifications"
            className={`relative inline-flex h-9 items-center border px-4 text-xs font-medium uppercase tracking-[0.12em] transition-colors ${
              pathname === "/seller/notifications"
                ? "border-gold/40 bg-gold/5 text-foreground"
                : "border-border-soft text-foreground hover:bg-cream"
            }`}
          >
            Notifications
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[9px] font-bold tabular-nums text-charcoal">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => signOut("/login?force=1")}
            className="inline-flex h-9 items-center border border-border-soft bg-charcoal px-4 text-xs font-medium uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-gold hover:text-charcoal"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
