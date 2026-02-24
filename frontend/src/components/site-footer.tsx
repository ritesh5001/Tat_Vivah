import Link from "next/link";
import Image from "next/image";

const policyLinks = [
  {
    label: "Cancellation Policy",
    href: "/contact",
  },
  {
    label: "Refund & Return Policy",
    href: "/contact",
  },
  {
    label: "Privacy Policy",
    href: "/contact",
  },
  {
    label: "Terms & Conditions",
    href: "/contact",
  },
  {
    label: "Shipping Policy",
    href: "/contact",
  },
];

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Shop", href: "/marketplace" },
  { label: "Contact Support", href: "/contact" },
  { label: "My Account", href: "/login" },
];

const collections = [
  {
    label: "Wedding Wear",
    href: "/marketplace",
  },
  {
    label: "Ethnic Kurtas",
    href: "/marketplace",
  },
  {
    label: "Sherwanis",
    href: "/marketplace",
  },
  {
    label: "Accessories",
    href: "/marketplace",
  },
  {
    label: "Festive Edit",
    href: "/marketplace",
  },
];

export function SiteFooter() {
  return (
    <footer
      className="relative overflow-hidden border-t border-border-soft bg-cream text-foreground font-sans"
      style={{
        backgroundImage:
          "radial-gradient(color-mix(in oklab, var(--color-gold) 28%, transparent) 0.6px, transparent 0.6px), radial-gradient(color-mix(in oklab, var(--color-gold) 28%, transparent) 0.6px, var(--color-cream) 0.6px)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 10px 10px",
      }}
    >
      <div className="absolute left-0 top-0 h-1.5 w-full bg-[repeating-linear-gradient(45deg,var(--color-brown),var(--color-brown)_10px,var(--color-gold)_10px,var(--color-gold)_12px)] shadow-[0_4px_12px_rgba(44,40,37,0.15)]" />

      <div className="mx-auto w-full max-w-6xl px-6 pt-14">
        <div className="grid gap-8 pb-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="min-w-0 pr-0 lg:pr-6">
            <Link href="/" className="inline-block transition-transform duration-300 hover:-translate-y-1">
              <Image
                src="/logo.png"
                alt="TatVivah Trends"
                width={160}
                height={64}
                className="mb-5 h-auto w-40"
              />
            </Link>
            <p className="max-w-xl border-l-[3px] border-gold pl-4 text-[15px] italic leading-7 text-muted-foreground max-sm:border-l-0 max-sm:border-t-[2px] max-sm:border-gold max-sm:pl-0 max-sm:pt-3">
              "Elegance Woven in Tradition." At TatVivah, we bring curated ethnic wear and handcrafted wedding fashion for modern celebrations rooted in heritage.
            </p>
          </div>

          <div className="min-w-0 group max-sm:text-center">
            <h3 className="mb-6 inline-block text-lg font-semibold uppercase tracking-[0.08em] text-foreground after:mt-2 after:block after:h-[2px] after:w-10 group-hover:after:w-full after:bg-gold after:shadow-[0_2px_0_var(--color-brown)] after:transition-all after:duration-300">
              Our Policies
            </h3>
            <ul className="space-y-2.5">
              {policyLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-2 text-sm font-medium tracking-[0.03em] text-foreground transition-all duration-300 hover:translate-x-1 hover:text-gold"
                  >
                    <span className="-ml-1 inline-block text-gold opacity-70 transition-opacity duration-300 group-hover:opacity-100">✿</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 group max-sm:text-center">
            <h3 className="mb-6 inline-block text-lg font-semibold uppercase tracking-[0.08em] text-foreground after:mt-2 after:block after:h-[2px] after:w-10 group-hover:after:w-full after:bg-gold after:shadow-[0_2px_0_var(--color-brown)] after:transition-all after:duration-300">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-2 text-sm font-medium tracking-[0.03em] text-foreground transition-all duration-300 hover:translate-x-1 hover:text-gold"
                  >
                    <span className="-ml-1 inline-block text-gold opacity-70 transition-opacity duration-300 group-hover:opacity-100">✿</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 group max-sm:text-center">
            <h3 className="mb-6 inline-block text-lg font-semibold uppercase tracking-[0.08em] text-foreground after:mt-2 after:block after:h-[2px] after:w-10 group-hover:after:w-full after:bg-gold after:shadow-[0_2px_0_var(--color-brown)] after:transition-all after:duration-300">
              Collections
            </h3>
            <ul className="space-y-2.5">
              {collections.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-2 text-sm font-medium tracking-[0.03em] text-foreground transition-all duration-300 hover:translate-x-1 hover:text-gold"
                  >
                    <span className="-ml-1 inline-block text-gold opacity-70 transition-opacity duration-300 group-hover:opacity-100">✿</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-charcoal py-5 text-ivory">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-5 px-6 max-sm:flex-col-reverse max-sm:text-center">
          <p className="text-xs tracking-wide text-gold/90">
            © 2026 TatVivah. Crafted with ♥ by NextGen Fusion.
          </p>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-gold/90">
            <span>Secure Payments</span>
            <span className="text-gold/40">•</span>
            <span>Trusted Checkout</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
