"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MotionCarousel } from "@/components/motion/MotionCarousel";

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
        className={`mx-auto max-w-6xl px-6 py-10 sm:py-12 lg:py-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="mb-10 text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold">Our Picks</p>
          <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">Product Showcase</h2>
        </div>

        <MotionCarousel>
          {showcaseProducts.map((product) => (
            <div
              key={product.id}
              className="snap-center shrink-0 w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] xl:w-[calc(20%-1.2rem)]"
            >
              <Link href="/marketplace" className="group block">
                <div className="relative overflow-hidden bg-cream dark:bg-brown/20 aspect-3/4">
                  <Image
                    src={product.imageSrc}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                    quality={75}
                  />
                </div>

                <div className="pt-4 text-center">
                  <h3 className="line-clamp-2 font-serif text-[14px] font-normal tracking-[0.01em] text-foreground transition-colors duration-300 group-hover:text-gold">
                    {product.title}
                  </h3>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground/90">
                    {product.category}
                  </p>
                  <div className="mt-2 flex items-baseline justify-center gap-2">
                    <span className="text-[15px] font-normal tracking-[0.01em] text-foreground">
                      {product.salePrice}
                    </span>
                    <span className="text-[15px] font-normal text-muted-foreground/70 line-through">
                      {product.regularPrice}
                    </span>
                    <span className="text-[12px] font-medium uppercase tracking-wider text-destructive">
                      {product.discount}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </MotionCarousel>
      </div>
    </section>
  );
}
