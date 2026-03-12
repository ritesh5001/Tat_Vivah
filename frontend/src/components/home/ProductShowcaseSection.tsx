"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

type ShowcaseProduct = {
  id: string;
  imageSrc: string;
  title: string;
  category: string;
  salePrice: string;
  regularPrice: string;
  discount: string;
};

const showcaseProducts: ShowcaseProduct[] = [
  {
    id: "shirt-1",
    imageSrc: "/images/hero/1st%20desktop%20banner.jpg",
    title: "Cotton Shirt for Men",
    category: "SHIRT",
    salePrice: "₹800",
    regularPrice: "₹1,000",
    discount: "20% OFF",
  },
  {
    id: "kurta-1",
    imageSrc: "/images/hero/2nd%20desktop%20banner.jpg",
    title: "Premium LinenKurta",
    category: "KURTA",
    salePrice: "₹2,500",
    regularPrice: "₹2,700",
    discount: "7% OFF",
  },
];

export function ProductShowcaseSection() {
  const [visible, setVisible] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="product-showcase" ref={sectionRef} className="border-t border-border-soft bg-cream/50 dark:bg-card/50">
      <div
        className={`mx-auto max-w-460 px-3 py-16 sm:px-6 sm:py-20 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="mb-12 text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold">Our Picks</p>
          <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">Product Showcase</h2>
        </div>

        <div className="px-0 sm:px-14 lg:px-16">
        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {showcaseProducts.map((product) => (
            <Link key={product.id} href="/marketplace" className="group block">
              <div className="relative overflow-hidden bg-cream dark:bg-brown/20 aspect-[3/4]">
                <Image
                  src={product.imageSrc}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  quality={75}
                />
              </div>

              <div className="mt-3 space-y-1">
                <h3 className="line-clamp-1 text-sm font-medium tracking-tight text-foreground transition-colors duration-300 group-hover:text-gold">
                  {product.title}
                </h3>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {product.category}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium tracking-tight text-foreground">
                    {product.salePrice}
                  </span>
                  <span className="text-xs text-muted-foreground/70 line-through">
                    {product.regularPrice}
                  </span>
                  <span className="text-[11px] font-semibold text-destructive">
                    {product.discount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
