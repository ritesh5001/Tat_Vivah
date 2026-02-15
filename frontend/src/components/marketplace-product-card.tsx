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

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative mb-5 overflow-hidden bg-cream dark:bg-brown/20 aspect-3/4 border border-border-soft transition-all duration-400 group-hover:border-gold/30">
        <img
          src={product.images?.[0] ?? "/images/product-placeholder.svg"}
          alt={product.title}
          className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <span className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border border-border-soft">
          {product.category?.name ?? "Featured"}
        </span>
        <span className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-wider text-gold border border-gold/20">
          Verified
        </span>
        <WishlistHeartButton
          productId={product.id}
          size={18}
          className="absolute bottom-4 right-4 h-8 w-8 bg-card/90 backdrop-blur-sm border border-border-soft text-muted-foreground hover:text-foreground hover:border-gold/50"
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-lg font-normal text-foreground group-hover:text-gold transition-colors duration-300">
          {product.title}
        </h3>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {product.category?.name ?? "Collection"}
        </p>
        {typeof primaryPrice === "number" ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">{currency.format(primaryPrice)}</span>
            {typeof product.regularPrice === "number" && product.regularPrice !== primaryPrice ? (
              <span className="text-muted-foreground line-through">
                {currency.format(product.regularPrice)}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Price on request</p>
        )}
      </div>
    </Link>
  );
}
