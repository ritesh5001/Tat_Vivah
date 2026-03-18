import Link from "next/link";

const adminLinks = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/occasions", label: "Occasions" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/settlements", label: "Settlements" },
  { href: "/admin/refunds", label: "Refunds" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/commissions", label: "Commissions" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/bestsellers", label: "Bestsellers" },
  { href: "/admin/cancellations", label: "Cancellations" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/security", label: "Security" },
];

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border-soft bg-card lg:block">
      <nav className="flex h-full flex-col gap-1 p-4">
        {adminLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex h-10 items-center border border-transparent px-3 text-sm font-medium text-foreground transition-colors hover:border-border-soft hover:bg-cream"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
