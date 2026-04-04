import Link from "next/link";
import Image from "next/image";
import type { BestsellerProduct } from "@/services/bestsellers";

type Props = {
  bestsellers: BestsellerProduct[];
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function resolvePrimaryPrice(product: BestsellerProduct): number | null {
  const value =
    product.salePrice ??
    product.adminPrice ??
    product.regularPrice ??
    product.minPrice;
  return typeof value === "number" ? value : null;
}

function resolveOriginalPrice(product: BestsellerProduct, displayPrice: number | null): number | null {
  if (typeof product.regularPrice !== "number") return null;
  if (displayPrice === null) return null;
  return product.regularPrice > displayPrice ? product.regularPrice : null;
}

export function BestsellersStrip({ bestsellers }: Props) {
  if (bestsellers.length === 0) {
    return (
      <section id="bestsellers" className="border-t border-border-soft">
        <div className="mx-auto max-w-460 px-3 py-16 sm:px-6 sm:py-20 lg:px-10">
          <div className="mb-12 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold">Most Loved</p>
            <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">Bestselling Pieces</h2>
          </div>
          <div className="border border-border-soft bg-card p-10 text-center text-sm text-muted-foreground">
            No bestsellers available yet.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="bestsellers" className="border-t border-border-soft">
      <div className="mx-auto max-w-460 px-3 py-16 sm:px-6 sm:py-20 lg:px-10">
        <div className="mb-12 text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold">Most Loved</p>
          <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">Bestselling Pieces</h2>
        </div>

        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide sm:px-2" style={{ WebkitOverflowScrolling: "touch" }}>
          {bestsellers.map((item) => {
            const displayPrice = resolvePrimaryPrice(item);
            const originalPrice = resolveOriginalPrice(item, displayPrice);
            const discountPercentage =
              typeof displayPrice === "number" && typeof originalPrice === "number" && originalPrice > 0
                ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
                : null;

            return (
              <Link
                key={item.id}
                href={`/product/${item.productId}`}
                className="group block shrink-0 snap-start w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]"
              >
                <div className="relative overflow-hidden bg-cream dark:bg-brown/20 aspect-3/4">
                  <Image
                    src={item.image || "/images/product-placeholder.svg"}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    quality={60}
                  />
                </div>

                <div className="mt-3 space-y-1">
                  <h3 className="line-clamp-1 text-sm font-medium tracking-tight text-foreground transition-colors duration-300 group-hover:text-gold">
                    {item.title}
                  </h3>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {item.categoryName ?? "Collection"}
                  </p>

                  {typeof displayPrice === "number" ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium tracking-tight text-foreground">
                        {currency.format(displayPrice)}
                      </span>
                      {typeof originalPrice === "number" && (
                        <span className="text-xs text-muted-foreground/70 line-through">
                          {currency.format(originalPrice)}
                        </span>
                      )}
                      {typeof discountPercentage === "number" && discountPercentage > 0 && (
                        <span className="text-[11px] font-semibold text-destructive">
                          {discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Price on request</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 border-b border-transparent pb-1 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-300 hover:border-gold hover:text-foreground"
          >
            Browse All Bestsellers
            <span className="text-gold">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
