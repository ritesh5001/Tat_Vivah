"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkoutWithPayment, getCart, type CouponPreview } from "@/services/cart";
import { initiatePayment, verifyPayment } from "@/services/payments";
import { getAddresses, type Address } from "@/services/addresses";
import CouponSection from "@/components/checkout/CouponSection";
import { toast } from "sonner";

const CHECKOUT_CART_SNAPSHOT_KEY = "tatvivah_checkout_cart_snapshot";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);
  const [cartTotal, setCartTotal] = React.useState(0);
  const [hasItems, setHasItems] = React.useState(false);
  const [razorpayReady, setRazorpayReady] = React.useState(false);
  const [taxSummary, setTaxSummary] = React.useState<{
    subTotalAmount: number;
    totalTaxAmount: number;
    grandTotal: number;
    discountAmount: number;
  } | null>(null);
  const [shipping, setShipping] = React.useState({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    pincode: "",
    notes: "",
  });
  const [savedAddresses, setSavedAddresses] = React.useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(null);

  // ---- Coupon state ----
  const [appliedCoupon, setAppliedCoupon] = React.useState<CouponPreview | null>(null);
  const cartItemsRef = React.useRef<string>("");

  const applyCartSnapshot = React.useCallback(
    (items: Array<{ variantId: string; quantity: number; priceSnapshot: number }>) => {
      setHasItems(items.length > 0);
      const subtotal = items.reduce(
        (sum, item) => sum + item.priceSnapshot * item.quantity,
        0
      );
      setCartTotal(subtotal + (items.length > 0 ? 180 : 0));

      const fingerprint = items
        .map((i) => `${i.variantId}:${i.quantity}`)
        .sort()
        .join("|");

      if (cartItemsRef.current && cartItemsRef.current !== fingerprint) {
        setAppliedCoupon(null);
      }
      cartItemsRef.current = fingerprint;
    },
    []
  );

  const loadRazorpayScript = React.useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem(CHECKOUT_CART_SNAPSHOT_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as {
            at: number;
            items: Array<{ variantId: string; quantity: number; priceSnapshot: number }>;
          };
          if (Date.now() - parsed.at < 60_000 && Array.isArray(parsed.items)) {
            applyCartSnapshot(parsed.items);
          }
        } catch {
          // Ignore malformed cache.
        }
      }
    }

    const loadCart = async () => {
      try {
        const cartResult = await getCart();
        const items = cartResult.cart.items ?? [];
        applyCartSnapshot(items);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            CHECKOUT_CART_SNAPSHOT_KEY,
            JSON.stringify({ at: Date.now(), items })
          );
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load cart"
        );
      }
    };

    const loadAddresses = async () => {
      try {
        const addrResult = await getAddresses();
        setSavedAddresses(addrResult.addresses);

        const defaultAddr = addrResult.addresses.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setShipping((prev) => ({
            ...prev,
            addressLine1: prev.addressLine1 || defaultAddr.addressLine1,
            addressLine2: prev.addressLine2 || defaultAddr.addressLine2 || "",
            city: prev.city || defaultAddr.city,
            pincode: prev.pincode || defaultAddr.pincode,
          }));
        }
      } catch {
        setSavedAddresses([]);
      }
    };

    void loadCart();
    void loadAddresses();
  }, [applyCartSnapshot]);

  React.useEffect(() => {
    loadRazorpayScript().then(setRazorpayReady);
  }, [loadRazorpayScript]);

  const handleCheckout = async () => {
    if (isPaying) return; // Prevent double-submit
    if (shipping.pincode && !/^\d{6}$/.test(shipping.pincode.trim())) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    setLoading(true);
    setIsPaying(true);
    try {
      const orderResult = await checkoutWithPayment({
        shippingName: shipping.name || undefined,
        shippingPhone: shipping.phone || undefined,
        shippingEmail: shipping.email || undefined,
        shippingAddressLine1: shipping.addressLine1 || undefined,
        shippingAddressLine2: shipping.addressLine2 || undefined,
        shippingCity: shipping.city || undefined,
        shippingPincode: shipping.pincode || undefined,
        shippingNotes: shipping.notes || undefined,
        couponCode: appliedCoupon?.code || undefined,
      });
      const orderId = orderResult.order?.id;
      if (!orderId) {
        throw new Error("Order ID missing. Please try again.");
      }

      // Store GST summary from backend response
      if (orderResult.order) {
        setTaxSummary({
          subTotalAmount: orderResult.order.subTotalAmount ?? 0,
          totalTaxAmount: orderResult.order.totalTaxAmount ?? 0,
          grandTotal: orderResult.order.grandTotal ?? 0,
          discountAmount: orderResult.order.discountAmount ?? 0,
        });
      }

      let gatewayReady = razorpayReady;
      if (!gatewayReady) {
        gatewayReady = await loadRazorpayScript();
        setRazorpayReady(gatewayReady);
      }

      if (!gatewayReady) {
        toast.error("Payment gateway failed to load.");
        return;
      }

      const data = orderResult.payment ?? (await initiatePayment(orderId, "RAZORPAY")).data;

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "TatVivah",
        description: "Complete your purchase",
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Payment successful. Order confirmed.");
            router.push("/user/dashboard");
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Payment verification failed"
            );
          }
        },
        modal: {
          ondismiss: () => {
            toast.message("Payment pending. You can retry from orders.");
            router.push("/user/orders");
          },
        },
        theme: { color: "#B7956C" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoading(false);
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16 lg:py-20"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
            Secure Checkout
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Complete Your Order
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your pieces are reserved. Please provide delivery details to finalize your purchase.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border-2 border-gold text-xs font-medium text-gold">
              1
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-foreground">
              Details
            </span>
          </div>
          <div className="h-px w-12 bg-border-soft" />
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-border-soft text-xs font-medium text-muted-foreground">
              2
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Payment
            </span>
          </div>
          <div className="h-px w-12 bg-border-soft" />
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-border-soft text-xs font-medium text-muted-foreground">
              3
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Confirm
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          {/* Shipping Form */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="space-y-8"
          >
            {/* Saved Address Picker */}
            {savedAddresses.length > 0 && (
              <div className="border border-border-soft bg-card p-8 space-y-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold mb-2">
                    Saved Addresses
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Select a saved address or enter a new one below.
                  </p>
                </div>
                <div className="h-px bg-border-soft" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setShipping((prev) => ({
                            ...prev,
                            addressLine1: addr.addressLine1,
                            addressLine2: addr.addressLine2 ?? "",
                            city: addr.city,
                            pincode: addr.pincode,
                          }));
                        }}
                        className={`text-left p-4 border transition-all duration-300 ${
                          isSelected
                            ? "border-gold bg-gold/5"
                            : "border-border-soft hover:border-gold/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-medium uppercase tracking-wider text-[#5A7352]">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{addr.addressLine1}</p>
                        {addr.addressLine2 && (
                          <p className="text-xs text-muted-foreground">{addr.addressLine2}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId(null);
                      setShipping((prev) => ({
                        ...prev,
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        pincode: "",
                      }));
                    }}
                    className={`text-left p-4 border transition-all duration-300 flex items-center justify-center ${
                      selectedAddressId === null
                        ? "border-gold bg-gold/5"
                        : "border-border-soft hover:border-gold/40"
                    }`}
                  >
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Enter New Address
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="border border-border-soft bg-card p-8 space-y-8">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold mb-2">
                  Delivery Address
                </p>
                <p className="text-sm text-muted-foreground">
                  Where shall we send your pieces?
                </p>
              </div>

              <div className="h-px bg-border-soft" />

              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Aarav Sharma"
                      value={shipping.name}
                      onChange={(event) =>
                        setShipping((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+91 98765 43210"
                      value={shipping.phone}
                      onChange={(event) =>
                        setShipping((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="you@email.com"
                    value={shipping.email}
                    onChange={(event) =>
                      setShipping((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="h-px bg-border-soft" />

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address Line 1</Label>
                    <Input
                      id="address"
                      placeholder="House no, street"
                      value={shipping.addressLine1}
                      onChange={(event) =>
                        setShipping((prev) => ({
                          ...prev,
                          addressLine1: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      placeholder="380001"
                      value={shipping.pincode}
                      inputMode="numeric"
                      maxLength={6}
                      onChange={(event) =>
                        setShipping((prev) => ({
                          ...prev,
                          pincode: event.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Ahmedabad"
                      value={shipping.city}
                      onChange={(event) =>
                        setShipping((prev) => ({
                          ...prev,
                          city: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    placeholder="Apartment, landmark"
                    value={shipping.addressLine2}
                    onChange={(event) =>
                      setShipping((prev) => ({
                        ...prev,
                        addressLine2: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Preferred delivery timing, special instructions"
                    value={shipping.notes}
                    onChange={(event) =>
                      setShipping((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Coupon + Payment Summary */}
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Coupon Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              <CouponSection
                cartTotal={Math.max(cartTotal - 180, 0)}
                appliedCoupon={appliedCoupon}
                onApply={setAppliedCoupon}
                onRemove={() => setAppliedCoupon(null)}
                disabled={isPaying || loading}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="border border-border-soft bg-card p-8 space-y-8"
            >
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Payment Summary
                </p>
                <div className="h-px bg-border-soft" />
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{currency.format(taxSummary ? taxSummary.subTotalAmount : Math.max(cartTotal - 180, 0))}</span>
                </div>
                {/* Discount row — only after checkout response */}
                {taxSummary && taxSummary.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span>−{currency.format(taxSummary.discountAmount)}</span>
                  </div>
                )}
                {/* Coupon preview badge (before checkout) */}
                {!taxSummary && appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="text-xs">
                      {appliedCoupon.type === "PERCENT"
                        ? `${appliedCoupon.value}% off`
                        : `₹${appliedCoupon.value} off`}
                    </span>
                  </div>
                )}
                {taxSummary && taxSummary.totalTaxAmount > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>GST</span>
                    <span>{currency.format(taxSummary.totalTaxAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{hasItems ? "₹180" : "—"}</span>
                </div>
                <div className="h-px bg-border-soft" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-foreground">
                    Grand Total
                  </span>
                  <span className="font-serif text-2xl font-light text-foreground">
                    {currency.format(taxSummary ? taxSummary.grandTotal : cartTotal)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Button
                    size="lg"
                    className="w-full h-14"
                    onClick={handleCheckout}
                    disabled={!hasItems || loading || isPaying}
                  >
                    {isPaying ? "Processing Payment..." : loading ? "Processing..." : "Complete Purchase"}
                  </Button>
                </motion.div>

                <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
                  By completing this purchase, you agree to our terms of service.
                  Your payment is secured with industry-standard encryption.
                </p>
              </div>

              {/* Trust Signals */}
              <div className="pt-4 border-t border-border-soft space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600/60" />
                  <span className="text-xs text-muted-foreground">
                    Secured by Razorpay
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  <span className="text-xs text-muted-foreground">
                    TatVivah Buyer Protection
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  <span className="text-xs text-muted-foreground">
                    10-Day Easy Returns
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
