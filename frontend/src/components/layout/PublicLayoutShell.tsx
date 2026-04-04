"use client";

import { usePathname } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export function PublicLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith("/admin") || pathname.startsWith("/seller");

  if (isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <PublicHeader />
      <main className="min-h-[calc(100vh-160px)]">{children}</main>
      <PublicFooter />
    </>
  );
}
