"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPricingOverview,
  getProfitAnalytics,
  setProductPrice,
  PricingOverviewProduct,
} from "@/services/admin";
import { toast } from "sonner";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getMarginStyle = (margin?: number | null) => {
  if (margin == null) return "border-border-soft text-muted-foreground bg-card";
  if (margin > 0) return "border-gold/30 text-gold bg-gold/10";
  if (margin === 0) return "border-border-soft text-muted-foreground bg-card";
  return "border-destructive/40 text-destructive bg-destructive/10";
};

const getStatusStyle = (status?: string | null) => {
  switch (String(status ?? "PENDING").toUpperCase()) {
    case "APPROVED":
      return "border-gold/40 text-gold bg-gold/10";
    case "REJECTED":
      return "border-destructive/30 text-destructive bg-destructive/10";
    default:
      return "border-border-soft text-muted-foreground bg-card";
  }
};

export default function AdminModerationPage() {
  const [loading, setLoading] = React.useState(true);
  const [products, setProducts] = React.useState<PricingOverviewProduct[]>([]);
  const [profit, setProfit] = React.useState<{
    totalPlatformRevenue: number;
    totalSellerPayout: number;
    totalMarginEarned: number;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] =
    React.useState<PricingOverviewProduct | null>(null);
  const [adminPriceInput, setAdminPriceInput] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [pricingResult, profitResult] = await Promise.all([
        getPricingOverview(),
        getProfitAnalytics(),
      ]);
      setProducts(pricingResult.products ?? []);
      setProfit({
        totalPlatformRevenue: profitResult.totalPlatformRevenue ?? 0,
        totalSellerPayout: profitResult.totalSellerPayout ?? 0,
        totalMarginEarned: profitResult.totalMarginEarned ?? 0,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load pricing overview"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const submitPrice = async () => {
    if (!selectedProduct) return;
    const nextPrice = Number(adminPriceInput);
    if (Number.isNaN(nextPrice) || nextPrice <= 0) {
      toast.error("Enter a valid admin listing price.");
      return;
    }
    if (nextPrice < Number(selectedProduct.sellerPrice ?? 0)) {
      toast.error("Admin listing price cannot be lower than seller price.");
      return;
    }

    try {
      await setProductPrice(selectedProduct.productId, nextPrice);
      toast.success("Price set successfully.");
      setSelectedProduct(null);
      setAdminPriceInput("");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to set product price"
      );
    }
  };

  const openPriceModal = (product: PricingOverviewProduct) => {
    setSelectedProduct(product);
    setAdminPriceInput(
      product.adminListingPrice != null ? String(product.adminListingPrice) : ""
    );
  };

  const previewMargin = React.useMemo(() => {
    if (!selectedProduct) return { margin: null as number | null, percentage: null as number | null };
    const seller = Number(selectedProduct.sellerPrice ?? 0);
    const admin = Number(adminPriceInput);
    if (Number.isNaN(admin) || admin <= 0 || seller <= 0) {
      return { margin: null, percentage: null };
    }
    const margin = admin - seller;
    return {
      margin,
      percentage: (margin / seller) * 100,
    };
  }, [adminPriceInput, selectedProduct]);

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background dark:bg-card">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:py-20"
      >
        <div className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
            Pricing Control Panel
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Product Pricing & Margin
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Set admin listing prices, approve listings, and monitor platform margin.
          </p>
        </div>

        {profit ? (
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="border border-border-soft bg-card p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Platform Revenue</p>
              <p className="font-serif text-2xl text-foreground">{currency.format(profit.totalPlatformRevenue)}</p>
            </div>
            <div className="border border-border-soft bg-card p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Seller Payout</p>
              <p className="font-serif text-2xl text-foreground">{currency.format(profit.totalSellerPayout)}</p>
            </div>
            <div className="border border-gold/30 bg-gold/10 p-4">
              <p className="text-[10px] uppercase tracking-wider text-gold">Margin Earned</p>
              <p className="font-serif text-2xl text-gold">{currency.format(profit.totalMarginEarned)}</p>
            </div>
          </section>
        ) : null}

        <section className="space-y-6">
          {loading ? (
            <div className="border border-border-soft bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="border border-border-soft bg-card p-12 text-center space-y-2">
              <p className="font-serif text-lg font-light text-foreground">
                No Products
              </p>
              <p className="text-sm text-muted-foreground">
                No products available for pricing.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border-soft bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-soft">
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Image</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Product Name</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Seller</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Seller Price</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Admin Price</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Margin</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Margin %</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {products.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.08 + index * 0.03, duration: 0.3 }}
                      className="hover:bg-cream/30 dark:hover:bg-brown/10"
                    >
                      <td className="p-5">
                        <div className="h-12 w-12 overflow-hidden border border-border-soft bg-card">
                          <img
                            src={product.image ?? "/images/product-placeholder.svg"}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="font-medium text-foreground">{product.title}</p>
                      </td>
                      <td className="p-5 text-muted-foreground">
                        {product.sellerName ?? product.sellerEmail ?? product.sellerId.slice(0, 8)}
                      </td>
                      <td className="p-5 text-muted-foreground">
                        {currency.format(Number(product.sellerPrice ?? 0))}
                      </td>
                      <td className="p-5 text-muted-foreground">
                        {product.adminListingPrice != null
                          ? currency.format(Number(product.adminListingPrice))
                          : "—"}
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider border ${getMarginStyle(product.margin)}`}>
                          {product.margin != null ? currency.format(product.margin) : "Pending"}
                        </span>
                      </td>
                      <td className="p-5 text-muted-foreground">
                        {product.marginPercentage != null ? `${product.marginPercentage.toFixed(2)}%` : "—"}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${getStatusStyle(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <Button size="sm" variant="outline" onClick={() => openPriceModal(product)}>
                          {product.adminListingPrice != null ? "Edit Price" : "Approve & Set Price"}
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <AnimatePresence>
          {selectedProduct ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4"
              onClick={() => setSelectedProduct(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-xl max-h-[90vh] overflow-y-auto border border-border-soft bg-card p-6 space-y-6"
              >
                <div className="flex items-start justify-between gap-4 border-b border-border-soft pb-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">Pricing Review</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">{selectedProduct.title}</h2>
                  </div>
                  <span className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${getStatusStyle(selectedProduct.status)}`}>
                    {selectedProduct.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Seller</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.sellerName ?? selectedProduct.sellerEmail ?? selectedProduct.sellerId}</p>
                  <p className="text-sm text-muted-foreground">
                    Seller Price: {currency.format(Number(selectedProduct.sellerPrice ?? 0))}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Admin Price</p>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={adminPriceInput}
                    onChange={(event) => setAdminPriceInput(event.target.value)}
                    placeholder="Enter admin listing price"
                  />
                  <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
                    <p>
                      Margin: {previewMargin.margin != null ? currency.format(previewMargin.margin) : "—"}
                    </p>
                    <p>
                      Margin %: {previewMargin.percentage != null ? `${previewMargin.percentage.toFixed(2)}%` : "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" onClick={submitPrice}>
                      Approve & Set Price
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedProduct(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
