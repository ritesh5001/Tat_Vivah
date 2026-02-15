"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addCartItem } from "@/services/cart";
import { toggleWishlistItem, checkWishlistItems } from "@/services/wishlist";

interface Variant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  inventory?: {
    stock: number;
  } | null;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    title: string;
    description?: string | null;
    category?: { name: string } | null;
    sellerId?: string;
    price?: number;
    regularPrice?: number;
    sellerPrice?: number;
    adminPrice?: number;
    salePrice?: number;
    variants: Variant[];
  };
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = React.useState(
    product.variants?.[0]?.id ?? ""
  );
  const [loading, setLoading] = React.useState(false);
  const [wishlisted, setWishlisted] = React.useState(false);
  const [wishlistLoading, setWishlistLoading] = React.useState(false);

  // Check initial wishlist state
  React.useEffect(() => {
    let cancelled = false;
    const hasToken = document.cookie.match(/(?:^|; )tatvivah_access=([^;]*)/);
    if (!hasToken) return;
    checkWishlistItems([product.id])
      .then((res) => {
        if (!cancelled) setWishlisted(res.wishlisted.includes(product.id));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [product.id]);

  const handleToggleWishlist = async () => {
    const hasToken = document.cookie.match(/(?:^|; )tatvivah_access=([^;]*)/);
    if (!hasToken) {
      toast.error("Please sign in to save items.");
      router.push("/login?force=1");
      return;
    }
    setWishlistLoading(true);
    const prev = wishlisted;
    setWishlisted(!prev);
    try {
      const result = await toggleWishlistItem(product.id);
      setWishlisted(result.added);
      toast.success(result.added ? "Added to wishlist" : "Removed from wishlist");
    } catch {
      setWishlisted(prev);
      toast.error("Unable to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const selectedVariant = product.variants.find(
    (variant) => variant.id === selectedVariantId
  );
  const salePrice = product.salePrice ?? product.adminPrice ?? product.price;
  // Compare-at should come from merchandising fields (variant compareAtPrice / product regularPrice),
  // not from sellerPrice (which is a cost/baseline and breaks strike-through after admin repricing).
  const compareAtPrice =
    selectedVariant?.compareAtPrice ?? product.regularPrice ?? null;

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error("Please choose a variant first.");
      return;
    }

    if (typeof document !== "undefined") {
      const hasToken = document.cookie.match(/(?:^|; )tatvivah_access=([^;]*)/);
      if (!hasToken) {
        toast.error("Please sign in to add items to cart.");
        router.push("/login?force=1");
        return;
      }
    }

    setLoading(true);
    try {
      await addCartItem({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity: 1,
      });
      toast.success("Added to cart.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add to cart";
      if (/access token required|unauthorized/i.test(message)) {
        toast.error("Please sign in to add items to cart.");
        router.push("/login?force=1");
        return;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col justify-center py-6 lg:py-12"
    >
      {/* Editorial Content Block */}
      <div className="space-y-10">
        {/* 1. Category / Style - Small, Uppercase */}
        <div className="space-y-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
            {product.category?.name ?? "Curated Collection"}
          </p>

          {/* 2. Product Name - Hero Typography */}
          <h1 className="font-serif text-3xl font-light leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {product.title}
          </h1>

          {/* 3. Trust Signals */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Verified Seller
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Pan-India Delivery
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-border-soft" />

        {/* 4. Price - Quiet Confidence */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Price
          </p>
          <div className="flex items-baseline gap-4">
            <p className="font-serif text-2xl font-light text-foreground sm:text-3xl">
              {typeof salePrice === "number" ? currency.format(salePrice) : "—"}
            </p>
            {typeof compareAtPrice === "number" &&
            typeof salePrice === "number" &&
            compareAtPrice > salePrice ? (
              <span className="text-sm text-muted-foreground line-through">
                {currency.format(compareAtPrice)}
              </span>
            ) : null}
          </div>
          {/* Stock Badge - Soft Pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground border border-border-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600/60" />
            In Stock
          </span>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-muted-foreground max-w-md">
          {product.description ??
            "Curated premium listing with verified quality assurance. Each piece is handcrafted with attention to detail and heritage craftsmanship."}
        </p>

        {/* Separator */}
        <div className="h-px bg-border-soft" />

        {/* 5. Variant Selection - Fabric Choice Feel */}
        <div className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Select Variant
          </p>
          <div className="flex flex-wrap gap-3">
            {product.variants.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Variants coming soon
              </span>
            ) : (
              product.variants.map((variant) => (
                <motion.button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`px-5 py-3 text-xs font-medium uppercase tracking-wider transition-all duration-300 ${selectedVariantId === variant.id
                      ? "border-2 border-gold bg-cream text-charcoal dark:bg-brown/30 dark:text-ivory"
                      : "border border-border-soft text-muted-foreground hover:border-gold/50 hover:text-foreground"
                    }`}
                >
                  {variant.sku}
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-border-soft" />

        {/* 6. CTA Buttons - Heavy, Confident */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex-1 sm:flex-initial"
          >
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={loading}
              className="w-full sm:w-auto min-w-50 h-14"
            >
              {loading ? "Adding..." : "Add to Cart"}
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Link
              href="/cart"
              className="inline-flex h-14 min-w-40 items-center justify-center border border-border-warm px-8 text-xs font-medium uppercase tracking-[0.15em] text-foreground transition-all duration-400 hover:bg-cream dark:hover:bg-brown/30"
            >
              View Cart
            </Link>
          </motion.div>

          {/* Wishlist Heart */}
          <motion.button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="inline-flex h-14 w-14 items-center justify-center border border-border-soft text-foreground transition-all duration-300 hover:border-gold/50 disabled:opacity-50"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={wishlisted ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
              className={`h-5 w-5 transition-colors duration-300 ${wishlisted ? "text-red-500" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
