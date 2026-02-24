"use client";

import Link from "next/link";
import { signOut } from "@/services/auth";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-background">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-7 w-1 bg-gold" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">TatVivah</p>
            <p className="text-sm font-semibold tracking-[0.08em] text-foreground">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/dashboard"
            className="inline-flex h-9 items-center border border-border-soft px-4 text-xs font-medium uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-cream"
          >
            Dashboard
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
