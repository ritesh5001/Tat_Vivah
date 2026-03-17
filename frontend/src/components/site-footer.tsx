"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getCategories } from "@/services/catalog";

const policyLinks = [
  {
    label: "Terms & Conditions",
    href: "/terms",
  },
  {
    label: "Privacy Policy",
    href: "/privacy",
  },
  {
    label: "Refund Policy",
    href: "/refund-policy",
  },
  {
    label: "Shipping Policy",
    href: "/shipping-policy",
  },
  {
    label: "Return Policy",
    href: "/return-policy",
  },
  {
    label: "Seller Terms",
    href: "/seller-terms",
  },
  {
    label: "Disclaimer",
    href: "/disclaimer",
  },
];

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Shop", href: "/marketplace" },
  { label: "Become a Seller", href: "/register/seller" },
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [dynamicCollections, setDynamicCollections] = useState(collections);

  useEffect(() => {
    getCategories()
      .then((res) => {
        if (res?.categories?.length > 0) {
          const mapped = res.categories
            .filter((c) => c.isActive)
            .slice(0, 5)
            .map((c) => ({
              label: c.name,
              href: `/marketplace?categoryId=${c.id}`,
            }));

          if (mapped.length > 0) {
            setDynamicCollections(mapped);
          }
        }
      })
      .catch(() => {
        // Fallback to static collections if API fails
      });
  }, []);

  const accordionSections = [
    {
      title: "Legal",
      links: policyLinks,
    },
    {
      title: "Quick Links",
      links: quickLinks,
    },
    {
      title: "Collections",
      links: dynamicCollections,
    },
  ];

  const toggleSection = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const shouldPrefetch = (href: string) => {
    if (href === "/register/seller") return false;
    if (href === "/marketplace" || href.startsWith("/marketplace?")) return false;
    return true;
  };

  return (
    <footer className="relative overflow-hidden border-t border-border-soft bg-cream text-foreground font-sans">
      {/* ornamental stripe removed per design request */}

      <div className="mx-auto w-full max-w-6xl px-6 pt-14">
        <div className="grid gap-6 pb-10 md:gap-8 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
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
            <p className="max-w-xl border-l-[3px] border-gold pl-4 text-[15px] italic leading-7 text-muted-foreground max-sm:border-l-0 max-sm:border-t-2 max-sm:border-gold max-sm:pl-0 max-sm:pt-3">
              "Elegance Woven in Tradition." At TatVivah, we bring curated ethnic wear and handcrafted wedding fashion for modern celebrations rooted in heritage.
            </p>
          </div>

          {accordionSections.map((section, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={section.title} className="min-w-0">
                <div className="md:hidden border-b border-border-soft">
                  <button
                    type="button"
                    onClick={() => toggleSection(index)}
                    className="flex w-full items-center justify-between px-2 py-3 text-left text-sm font-semibold uppercase tracking-[0.18em] text-foreground"
                  >
                    <span>{section.title}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-4 w-4 text-gold transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <div
                    className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isOpen ? "max-h-125" : "max-h-0"
                      }`}
                  >
                    <ul className="space-y-3 px-4 pb-4 text-sm font-medium tracking-[0.05em] text-foreground">
                      {section.links.map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            prefetch={shouldPrefetch(item.href)}
                            className="group flex items-center gap-2 transition-all duration-300 hover:translate-x-1 hover:text-gold"
                          >
                            <span className="-ml-1 inline-block text-gold opacity-70 transition-opacity duration-300 group-hover:opacity-100">
                              ✿
                            </span>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="hidden md:block group max-sm:text-center">
                  <h3 className="mb-6 inline-block text-lg font-semibold uppercase tracking-[0.08em] text-foreground after:mt-2 after:block after:h-0.5 after:w-10 group-hover:after:w-full after:bg-gold after:shadow-[0_2px_0_var(--color-brown)] after:transition-all after:duration-300">
                    {section.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {section.links.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          prefetch={shouldPrefetch(item.href)}
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
            );
          })}
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
