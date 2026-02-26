"use client";

import * as React from "react";
import { MotionCarousel } from "@/components/motion/MotionCarousel";
import { MotionCard } from "@/components/motion/MotionCard";

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
            <MotionCard
              key={product.id}
              imageSrc={product.imageSrc}
              imageAlt={product.title}
              aspectClass="aspect-3/4"
            >
              <div className="px-4 pt-5 pb-6 text-center">
                <h3 className="font-serif text-[2rem] font-normal leading-tight tracking-tight text-foreground md:text-[1.35rem] xl:text-[1.2rem]">
                  {product.title}
                </h3>
                <p className="mt-5 text-[1.05rem] uppercase tracking-[0.35em] text-muted-foreground md:text-[0.95rem]">
                  {product.category}
                </p>
                <div className="mt-4 flex items-baseline justify-center gap-3">
                  <span className="text-[2.05rem] font-normal tracking-tight text-foreground md:text-[1.7rem] xl:text-[1.55rem]">
                    {product.salePrice}
                  </span>
                  <span className="text-[1.6rem] font-normal text-muted-foreground/70 line-through md:text-[1.3rem] xl:text-[1.15rem]">
                    {product.regularPrice}
                  </span>
                  <span className="text-[1.1rem] font-medium uppercase tracking-[0.08em] text-destructive md:text-[0.95rem]">
                    {product.discount}
                  </span>
                </div>
              </div>
            </MotionCard>
          ))}
        </MotionCarousel>
      </div>
    </section>
  );
}
