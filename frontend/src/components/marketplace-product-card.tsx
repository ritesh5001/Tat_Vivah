import Link from "next/link";
import Image from "next/image";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export interface MarketplaceCardProduct {
  id: string;
  /** Bestsellers use `productId` instead of `id` for wishlist */
  productId?: string;
  title: string;
  images?: string[];
  /** Bestsellers use `image` (single) instead of `images` */
  image?: string | null;
  category?: { id?: string; name: string } | null;
  /** Bestsellers use `categoryName` string */
  categoryName?: string | null;
  salePrice?: number | null;
  adminPrice?: number | null;
  price?: number | null;
  regularPrice?: number | null;
  sellerPrice?: number | null;
  adminListingPrice?: number | null;
  minPrice?: number | null;
  activeCoupon?: MarketplaceCardCouponPreview | null;
  coupon?: MarketplaceCardCouponPreview | null;
  couponPreview?: MarketplaceCardCouponPreview | null;
  coupons?: MarketplaceCardCouponPreview[] | null;
}

type CouponKind = "PERCENT" | "FLAT";

interface MarketplaceCardCouponPreview {
  code?: string;
  type?: CouponKind | string | null;
  value?: number | null;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  discountedPrice?: number | null;
  finalPrice?: number | null;
  isActive?: boolean | null;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function resolveCouponCandidates(product: MarketplaceCardProduct): MarketplaceCardCouponPreview[] {
  const candidates: MarketplaceCardCouponPreview[] = [];

  if (product.activeCoupon) candidates.push(product.activeCoupon);
  if (product.coupon) candidates.push(product.coupon);
  if (product.couponPreview) candidates.push(product.couponPreview);
  if (Array.isArray(product.coupons)) candidates.push(...product.coupons);

  return candidates.filter((coupon) => coupon && coupon.isActive !== false);
}

function resolveCouponPrice(product: MarketplaceCardProduct, displayPrice: number | null): number | null {
  if (displayPrice === null || displayPrice <= 0) return null;

  const candidates = resolveCouponCandidates(product);
  let bestCouponPrice: number | null = null;

  for (const coupon of candidates) {
    const directDiscountedPrice = toNumber(coupon.discountedPrice) ?? toNumber(coupon.finalPrice);

    if (directDiscountedPrice !== null && directDiscountedPrice > 0 && directDiscountedPrice < displayPrice) {
      bestCouponPrice =
        bestCouponPrice === null ? directDiscountedPrice : Math.min(bestCouponPrice, directDiscountedPrice);
      continue;
    }

    const value = toNumber(coupon.value);
    if (value === null || value <= 0) continue;

    const minOrderAmount = toNumber(coupon.minOrderAmount) ?? 0;
    if (displayPrice < minOrderAmount) continue;

    const normalizedType = String(coupon.type ?? "").toUpperCase();
    let discountAmount = normalizedType === "PERCENT" ? (displayPrice * value) / 100 : value;

    const maxDiscountAmount = toNumber(coupon.maxDiscountAmount);
    if (maxDiscountAmount !== null) {
      discountAmount = Math.min(discountAmount, maxDiscountAmount);
    }

    const discountedPrice = Math.max(0, displayPrice - discountAmount);
    if (discountedPrice < displayPrice) {
      bestCouponPrice = bestCouponPrice === null ? discountedPrice : Math.min(bestCouponPrice, discountedPrice);
    }
  }

  if (bestCouponPrice === null) return null;
  return Math.round(bestCouponPrice * 100) / 100;
}

function resolvePrimaryPrice(product: MarketplaceCardProduct): number | null {
  const value =
    product.salePrice ??
    product.adminPrice ??
    product.price ??
    product.adminListingPrice ??
    product.minPrice ??
    product.sellerPrice;
  return typeof value === "number" ? value : null;
}

function resolveOriginalPrice(product: MarketplaceCardProduct, displayPrice: number | null): number | null {
  if (typeof product.regularPrice !== "number") return null;
  if (displayPrice === null) return null;
  return product.regularPrice > displayPrice ? product.regularPrice : null;
}

export function MarketplaceProductCard({ product }: { product: MarketplaceCardProduct }) {
  const displayPrice = resolvePrimaryPrice(product);
  const originalPrice = resolveOriginalPrice(product, displayPrice);
  const couponPrice = resolveCouponPrice(product, displayPrice);

  const discountPercentage =
    typeof displayPrice === "number" && typeof originalPrice === "number" && originalPrice > 0
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : null;

  const imageSrc = product.images?.[0] ?? product.image ?? "/images/product-placeholder.svg";
  const categoryLabel = product.category?.name ?? product.categoryName ?? "Collection";

  return (
    <Link href={`/product/${product.id}`} className="group block">
      {/* Image */}
      <div className="relative overflow-hidden bg-cream dark:bg-brown/20 aspect-3/4">
        <Image
          src={imageSrc}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          quality={60}
        />
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/90">
          {categoryLabel}
        </p>
        <h3 className="line-clamp-2 min-h-[2.45rem] text-[1.02rem] font-medium leading-[1.2] tracking-tight text-foreground transition-colors duration-300 group-hover:text-gold">
          {product.title}
        </h3>
        {typeof displayPrice === "number" ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-[1.15rem] font-semibold leading-none tracking-tight text-foreground">
                {currency.format(displayPrice)}
              </span>
              {typeof originalPrice === "number" && (
                <span className="text-[12px] text-muted-foreground/80 line-through">
                  {currency.format(originalPrice)}
                </span>
              )}
              {typeof discountPercentage === "number" && discountPercentage > 0 && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
            {typeof couponPrice === "number" && couponPrice < displayPrice && (
              <p className="inline-flex w-fit bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium leading-none text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                Get it for {currency.format(couponPrice)} with coupon
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Price on request</p>
        )}
      </div>
    </Link>
  );
}
