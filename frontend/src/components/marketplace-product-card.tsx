"use client";

import Link from "next/link";
import { WishlistHeartButton } from "@/components/wishlist-heart-button";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export interface MarketplaceCardProduct {
  id: string;
  title: string;
  images?: string[];
  category?: { id?: string; name: string } | null;
  salePrice?: number | null;
  adminPrice?: number | null;
  price?: number | null;
  regularPrice?: number | null;
  sellerPrice?: number | null;
  adminListingPrice?: number | null;
}

function resolvePrimaryPrice(product: MarketplaceCardProduct): number | null {
  const value =
    product.salePrice ??
    product.adminPrice ??
    product.price ??
    product.adminListingPrice ??
    product.sellerPrice;
  return typeof value === "number" ? value : null;
}

export function MarketplaceProductCard({ product }: { product: MarketplaceCardProduct }) {
  const primaryPrice = resolvePrimaryPrice(product);
  const regularPrice = typeof product.regularPrice === "number" ? product.regularPrice : null;

  const displayPrice =
    typeof primaryPrice === "number" && typeof regularPrice === "number"
      ? Math.min(primaryPrice, regularPrice)
      : primaryPrice ?? regularPrice;

  const originalPrice =
    typeof primaryPrice === "number" && typeof regularPrice === "number" && primaryPrice !== regularPrice
      ? Math.max(primaryPrice, regularPrice)
      : null;

  const discountPercentage =
    typeof displayPrice === "number" && typeof originalPrice === "number" && originalPrice > 0
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : null;

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative overflow-hidden bg-cream dark:bg-brown/20 aspect-3/4">
        <img
          src={product.images?.[0] ?? "/images/product-placeholder.svg"}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <WishlistHeartButton
          productId={product.id}
          size={18}
          className="absolute left-4 top-4 h-10 w-10 rounded-sm bg-card text-destructive shadow-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
        />
      </div>

      <div className="pt-4 text-center">
        <h3 className="line-clamp-2 font-serif text-[14px] font-normal tracking-[0.01em] text-foreground transition-colors duration-300 group-hover:text-gold">
          {product.title}
        </h3>
        <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground/90">
          {product.category?.name ?? "Collection"}
        </p>
        {typeof displayPrice === "number" ? (
          <div className="mt-2 flex items-baseline justify-center gap-2">
            <span className="text-[15px] font-normal tracking-[0.01em] text-foreground">
              {currency.format(displayPrice)}
            </span>
            {typeof originalPrice === "number" ? (
              <span className="text-[15px] font-normal text-muted-foreground/70 line-through">
                {currency.format(originalPrice)}
              </span>
            ) : null}
            {typeof discountPercentage === "number" && discountPercentage > 0 ? (
              <span className="text-[12px] font-medium uppercase tracking-wider text-destructive">{discountPercentage}% OFF</span>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-[13px] text-muted-foreground">Price on request</p>
        )}
      </div>
    </Link>
  );
}
