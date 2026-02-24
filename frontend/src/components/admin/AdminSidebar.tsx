import Link from "next/link";

const adminLinks = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/reviews", label: "Reviews" },
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
