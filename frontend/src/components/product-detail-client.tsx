"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeftRight, ChevronDown, CircleHelp, Eye, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addCartItem } from "@/services/cart";
import { toggleWishlistItem, checkWishlistItems } from "@/services/wishlist";
import { createAppointment } from "@/services/appointments";
import { startNavigationFeedback } from "@/lib/navigation-feedback";
import { upsertCheckoutSnapshotItem } from "@/lib/checkout-snapshot";

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
  const [buyNowLoading, setBuyNowLoading] = React.useState(false);
  const [wishlisted, setWishlisted] = React.useState(false);
  const [wishlistLoading, setWishlistLoading] = React.useState(false);
  const [pincode, setPincode] = React.useState("");
  const [deliveryMessage, setDeliveryMessage] = React.useState("");
  const [bookModalOpen, setBookModalOpen] = React.useState(false);
  const [appointmentDate, setAppointmentDate] = React.useState("");
  const [appointmentTime, setAppointmentTime] = React.useState("");
  const [booking, setBooking] = React.useState(false);

  const getLocalDateString = React.useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const minAppointmentDate = getLocalDateString();

  const handlePincodeCheck = () => {
    if (pincode.length === 6) {
      const days1 = Math.floor(Math.random() * 3) + 4; // 4 to 6
      const days2 = days1 + Math.floor(Math.random() * 2) + 1; // + 1-2 days
      setDeliveryMessage(`Expected Delivery in ${days1}-${days2} days`);
    } else {
      setDeliveryMessage("Please enter a valid 6-digit pincode.");
    }
  };

  // Check initial wishlist state
  React.useEffect(() => {
    let cancelled = false;
    const hasToken = document.cookie.match(/(?:^|; )tatvivah_access=([^;]*)/);
    if (!hasToken) return;
    checkWishlistItems([product.id])
      .then((res) => {
        if (!cancelled) setWishlisted(res.wishlisted.includes(product.id));
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [product.id]);

  React.useEffect(() => {
    router.prefetch("/checkout");
  }, [router]);

  const handleToggleWishlist = async () => {
    const hasToken = document.cookie.match(/(?:^|; )tatvivah_access=([^;]*)/);
    if (!hasToken) {
      toast.error("Please sign in to save items.");
      startNavigationFeedback();
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
  const compareAtPrice = selectedVariant?.compareAtPrice ?? product.regularPrice ?? null;
  const hasDiscount =
    typeof compareAtPrice === "number" &&
    typeof salePrice === "number" &&
    compareAtPrice > salePrice;
  const savingsAmount = hasDiscount ? compareAtPrice - salePrice : 0;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - salePrice) / compareAtPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error("Please choose a variant first.");
      return;
    }

    if (typeof document !== "undefined") {
      const hasToken = document.cookie.match(/(?:^|; )tatvivah_access=([^;]*)/);
      if (!hasToken) {
        toast.error("Please sign in to add items to cart.");
        startNavigationFeedback();
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
        startNavigationFeedback();
        router.push("/login?force=1");
        return;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant) {
      toast.error("Please choose a variant first.");
      return;
    }

    if (typeof document !== "undefined") {
      const hasToken = document.cookie.match(/(?:^|; )tatvivah_access=([^;]*)/);
      if (!hasToken) {
        toast.error("Please sign in to continue.");
        startNavigationFeedback();
        router.push("/login?force=1");
        return;
      }
    }

    setBuyNowLoading(true);
    try {
      const result = await addCartItem({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity: 1,
      });
      upsertCheckoutSnapshotItem({
        variantId: result.item.variantId,
        quantity: result.item.quantity,
        priceSnapshot: result.item.priceSnapshot,
      });
      startNavigationFeedback();
      router.push("/checkout");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to continue to checkout";
      if (/access token required|unauthorized/i.test(message)) {
        toast.error("Please sign in to continue.");
        startNavigationFeedback();
        router.push("/login?force=1");
        return;
      }
      toast.error(message);
    } finally {
      setBuyNowLoading(false);
    }
  };

  const handleOpenBooking = () => {
    const roleMatch = document.cookie.match(/(?:^|; )tatvivah_role=([^;]*)/);
    const role = roleMatch ? decodeURIComponent(roleMatch[1]).toUpperCase() : "";
    const hasToken = document.cookie.match(/(?:^|; )tatvivah_access=([^;]*)/);

    if (!hasToken || role !== "USER") {
      toast.error("Please sign in as a customer to book a video call.");
      startNavigationFeedback();
      router.push("/login?force=1");
      return;
    }

    if (!product.sellerId) {
      toast.error("Seller details are unavailable for this product.");
      return;
    }

    setBookModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!appointmentDate || !appointmentTime) {
      toast.error("Please select both date and time.");
      return;
    }

    const selectedDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
    if (Number.isNaN(selectedDateTime.getTime())) {
      toast.error("Please choose a valid date and time.");
      return;
    }

    if (appointmentDate < minAppointmentDate) {
      toast.error("Please choose today or a future date.");
      return;
    }

    if (selectedDateTime.getTime() <= Date.now()) {
      toast.error("Please choose a future time slot.");
      return;
    }

    if (!product.sellerId) {
      toast.error("Seller details are unavailable for this product.");
      return;
    }

    setBooking(true);
    try {
      await createAppointment({
        sellerId: product.sellerId,
        productId: product.id,
        date: appointmentDate,
        time: appointmentTime,
      });
      toast.success("Video appointment booked.");
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "tatvivah_appointment_alert",
          "Your appointment is booked successfully.",
        );
      }
      setBookModalOpen(false);
      setAppointmentDate("");
      setAppointmentTime("");
      startNavigationFeedback();
      router.push("/user/appointments");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to book appointment");
    } finally {
      setBooking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex min-w-0 max-w-full flex-col justify-center overflow-x-clip py-4 sm:py-6 lg:py-12"
    >
      {/* Editorial Content Block */}
      {/* Editorial Content Block */}
      <div className="space-y-6">
        {/* 1. Title */}
        <h1 className="break-words font-serif text-2xl font-light leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl xl:text-5xl">
          {product.title}
        </h1>

        {/* 2. Price & SKU */}
        <div className="space-y-2 pt-1 border-b border-border-soft pb-6">
          <div className="flex items-baseline gap-3 relative">
            <span className="font-serif text-3xl font-medium text-foreground sm:text-4xl">
              {typeof salePrice === "number" ? currency.format(salePrice) : "—"}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {currency.format(compareAtPrice)}
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full bg-[#d85025]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#d85025]">
                {discountPercent}% off
              </span>
            )}
            <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">MRP (Inclusive of all taxes)</span>
          </div>
          {hasDiscount && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#b03d19]">
              You save {currency.format(savingsAmount)} + limited-time offer
            </p>
          )}
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest pt-2">
            SKU ID- {selectedVariant?.sku ?? product.variants[0]?.sku ?? "N/A"}
          </p>
        </div>

        {/* 3. Colour Selection */}
        <div className="space-y-4 pt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground">
            SELECT COLOUR
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            {/* Mock colors matching typical variants - assuming the backend currently uses unified SKUs without explicit color attributes */}
            {['bg-stone-500', 'bg-slate-900', 'bg-zinc-800', 'bg-amber-950'].map((colorClass, idx) => (
              <button
                key={idx}
                type="button"
                className={`flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] ${idx === 0 ? 'border-gold p-0.5' : 'border-transparent'} hover:opacity-80 transition-all`}
              >
                <div className={`h-full w-full rounded-full ${colorClass}`} />
              </button>
            ))}
          </div>
        </div>

        {/* 4. Size Selection */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground">
              SELECT SIZE
            </p>
            <button className="flex items-center gap-1.5 text-[11px] text-foreground underline decoration-1 underline-offset-4 hover:text-gold transition-colors tracking-wide">
              <CircleHelp className="h-3.5 w-3.5" strokeWidth={1.5} />
              Size Chart
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-2">
            {product.variants.length === 0 ? (
              <span className="text-sm text-muted-foreground">Variants coming soon</span>
            ) : (
              product.variants.map((variant, idx) => (
                <motion.button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`relative px-5 py-3 text-xs font-medium uppercase tracking-wider transition-all duration-300 min-w-14
                     ${selectedVariantId === variant.id
                      ? "border border-gold bg-cream text-charcoal dark:bg-brown/30 dark:text-ivory"
                      : "border border-border-soft text-muted-foreground hover:border-gold/50 hover:text-foreground"
                    }`}
                >
                  {variant.sku.split('-').pop() || variant.sku}
                  {/* Stock Badge - Mocked for matching design visually */}
                  {(idx === 6 || idx === 8) && (
                    <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#d85025] text-white text-[9px] font-semibold px-2 py-0.5 rounded-sm shadow-sm whitespace-nowrap z-10 tracking-widest">
                      3 Left
                    </span>
                  )}
                </motion.button>
              ))
            )}
          </div>
          <button className="text-[11px] text-muted-foreground underline decoration-1 underline-offset-4 hover:text-foreground transition-colors pt-2 block tracking-wide">
            - Less sizes
          </button>
        </div>

        {/* 5. Views Counter */}
        <div className="flex items-center gap-2 pt-6 pb-2 text-[13px] text-foreground">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="font-medium tracking-wide">671</span> people have viewed the product recently
        </div>

        {/* 6. Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.4 }} className="flex-1">
            <Button
              size="lg"
              variant="outline"
              onClick={handleAddToCart}
              disabled={loading || buyNowLoading}
              className="w-full h-14 border border-gold/40 bg-[#fefaf6] dark:bg-brown/20 text-[#d85025] hover:bg-cream dark:hover:bg-brown/40 hover:text-[#b03d19] font-medium tracking-widest uppercase text-[13px] transition-colors"
            >
              {loading ? "Adding..." : "Add to Cart"}
            </Button>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.4 }} className="flex-1">
            <Button
              size="lg"
              onClick={handleBuyNow}
              disabled={buyNowLoading || loading}
              className="w-full h-14 bg-[#d85025] hover:bg-[#b03d19] text-white font-medium tracking-widest uppercase text-[13px] border-none transition-colors"
            >
              {buyNowLoading ? "Processing..." : "Buy Now"}
            </Button>
          </motion.div>
        </div>

        <div className="pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenBooking}
            className="h-12 w-full border border-gold/40 text-[12px] font-medium uppercase tracking-[0.12em] text-foreground hover:bg-gold/5"
          >
            Book Video Call
          </Button>
        </div>

        {/* 7. Pincode Check */}
        <div className="pt-6 relative">
          <div className="flex flex-col gap-2">
            <div className="flex items-center border border-border-soft overflow-hidden h-14 transition-colors focus-within:border-gold">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPincode(val);
                  if (val.length < 6) setDeliveryMessage("");
                }}
                placeholder="Enter pincode"
                className="flex-1 bg-transparent px-5 py-2 outline-none text-[13px] placeholder:text-muted-foreground tracking-wide font-medium"
              />
              <button
                onClick={handlePincodeCheck}
                disabled={pincode.length !== 6}
                className="h-full border-l border-border-soft px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-border-soft/30 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8 sm:text-[12px] sm:tracking-[0.15em]"
              >
                Check
              </button>
            </div>
            {deliveryMessage && (
              <p className="text-xs font-medium text-green-600 dark:text-green-500 px-1 animate-in fade-in slide-in-from-top-1">
                {deliveryMessage}
              </p>
            )}
          </div>
        </div>

        {/* 8. Delivery Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 pb-6 border-b border-border-soft">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-[#fefaf6] dark:bg-brown/30 text-gold shrink-0 border border-gold/10">
              <Truck className="h-5.5 w-5.5" strokeWidth={1.35} />
            </div>
            <p className="text-[14px] font-medium leading-tight text-foreground">Free delivery<br /><span className="text-[13px] text-muted-foreground font-normal">within 2-3 days</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-[#fefaf6] dark:bg-brown/30 text-gold shrink-0 border border-gold/10">
              <ArrowLeftRight className="h-5.5 w-5.5" strokeWidth={1.35} />
            </div>
            <p className="text-[14px] font-medium leading-tight text-foreground">Easy Exchange in<br /><span className="text-[13px] text-muted-foreground font-normal">10 days</span></p>
          </div>
        </div>

        {/* 9. Accordions */}
        <div className="pt-2 space-y-0 text-[13px] text-muted-foreground">
          <details className="border-b border-border-soft group list-none [&::-webkit-details-marker]:hidden" open>
            <summary className="flex w-full items-center justify-between py-5 text-[12px] font-bold uppercase tracking-[0.15em] text-foreground hover:text-gold transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              Product Details
              <ChevronDown className="h-4.5 w-4.5 transition-transform group-open:rotate-180" strokeWidth={1.5} />
            </summary>
            <div className="pb-5 space-y-3 animate-in fade-in slide-in-from-top-2">
              <p className="leading-relaxed">
                {product.description || "Indulge in the finest craftsmanship with this stunning piece, designed to stand out. Impeccably tailored to match the highest standards."}
              </p>
              <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 border-t border-border-soft pt-4 sm:grid-cols-2">
                <li><strong className="text-foreground uppercase text-[10px] tracking-widest font-bold">Category:</strong> {product.category?.name || "Curated Collection"}</li>
                <li><strong className="text-foreground uppercase text-[10px] tracking-widest font-bold">Color:</strong> Multi Variation</li>
                <li><strong className="text-foreground uppercase text-[10px] tracking-widest font-bold">Material:</strong> Premium Blend</li>
                <li><strong className="text-foreground uppercase text-[10px] tracking-widest font-bold">Fit:</strong> Regular Fit</li>
                <li><strong className="text-foreground uppercase text-[10px] tracking-widest font-bold">Care:</strong> Dry Clean Only</li>
                <li><strong className="text-foreground uppercase text-[10px] tracking-widest font-bold">Origin:</strong> Made in India</li>
              </ul>
            </div>
          </details>

          <details className="border-b border-border-soft group list-none [&::-webkit-details-marker]:hidden">
            <summary className="flex w-full items-center justify-between py-5 text-[12px] font-bold uppercase tracking-[0.15em] text-foreground hover:text-gold transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              Product Declaration
              <ChevronDown className="h-4.5 w-4.5 transition-transform group-open:rotate-180" strokeWidth={1.5} />
            </summary>
            <div className="pb-5 space-y-3 animate-in fade-in slide-in-from-top-2">
              <p className="leading-relaxed">
                All our products are sourced directly from verified artisans and manufacturers. Colors may slightly vary from the pictures due to lighting conditions and varying screen display resolutions.
              </p>
            </div>
          </details>

          <details className="border-b border-border-soft group list-none [&::-webkit-details-marker]:hidden">
            <summary className="flex w-full items-center justify-between py-5 text-[12px] font-bold uppercase tracking-[0.15em] text-foreground hover:text-gold transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              Shipping & Returns
              <ChevronDown className="h-4.5 w-4.5 transition-transform group-open:rotate-180" strokeWidth={1.5} />
            </summary>
            <div className="pb-5 space-y-3 animate-in fade-in slide-in-from-top-2">
              <p className="leading-relaxed">
                We offer free PAN-India delivery across all major pincodes. Typical dispatch times range from 24-48 hours. Items can be exchanged or returned within 10 days of delivery, provided they remain unworn, with tags intact and in their original packaging.
              </p>
            </div>
          </details>
        </div>
      </div>

      {bookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md border border-border-soft bg-card p-6 shadow-xl">
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold">WhatsApp Consultation</p>
              <h3 className="mt-2 font-serif text-2xl font-light text-foreground">Book Video Call</h3>
              <p className="mt-2 text-sm text-muted-foreground">Select your preferred date and time for the seller video call.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Date
                </label>
                <input
                  type="date"
                  min={minAppointmentDate}
                  value={appointmentDate}
                  onChange={(event) => setAppointmentDate(event.target.value)}
                  className="h-11 w-full border border-border-soft bg-background px-3 text-sm text-foreground outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Time
                </label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(event) => setAppointmentTime(event.target.value)}
                  className="h-11 w-full border border-border-soft bg-background px-3 text-sm text-foreground outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setBookModalOpen(false)}
                disabled={booking}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleConfirmBooking}
                disabled={booking}
              >
                {booking ? "Booking..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
