"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminProduct, approveProduct, getPendingProducts, rejectProduct } from "@/services/admin";
import { toast } from "sonner";

const getStatusStyle = (status?: string | null) => {
  switch (String(status ?? "PENDING").toUpperCase()) {
    case "APPROVED":
      return "border-[#7B9971]/30 text-[#5A7352] bg-[#7B9971]/5";
    case "REJECTED":
      return "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5";
    default:
      return "border-[#B8956C]/30 text-[#8A7054] bg-[#B8956C]/5";
  }
};

const getStartingPrice = (product: AdminProduct) => {
  if (!product.variants?.length) return "—";
  const min = Math.min(...product.variants.map((variant) => Number(variant.price ?? 0)).filter((price) => price > 0));
  if (!Number.isFinite(min)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(min);
};

export default function AdminModerationPage() {
  const [loading, setLoading] = React.useState(true);
  const [products, setProducts] = React.useState<AdminProduct[]>([]);
  const [reasons, setReasons] = React.useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = React.useState<AdminProduct | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPendingProducts();
      setProducts(result.products ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load pending products"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: string) => {
    try {
      await approveProduct(id);
      toast.success("Product approved.");
      load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to approve product"
      );
    }
  };

  const handleReject = async (id: string) => {
    const reason = reasons[id] ?? "";
    if (!reason.trim()) {
      toast.error("Add a rejection reason.");
      return;
    }
    try {
      await rejectProduct(id, reason);
      toast.success("Product rejected.");
      setReasons((prev) => ({ ...prev, [id]: "" }));
      load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to reject product"
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:py-20"
      >
        {/* Header */}
        <div className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
            Product Approval Requests
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Approval Queue
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Review pending listings and approve or reject with clear moderation decisions.
          </p>
        </div>

        {/* Pending Products */}
        <section className="space-y-6">
          {loading ? (
            <div className="border border-border-soft bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="border border-border-soft bg-card p-12 text-center space-y-2">
              <p className="font-serif text-lg font-light text-foreground">
                All Clear
              </p>
              <p className="text-sm text-muted-foreground">
                No products pending moderation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border-soft bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-soft">
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Image</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Title</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Seller</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Price</th>
                    <th className="p-5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Created</th>
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
                            src={product.images?.[0] ?? "/images/product-placeholder.svg"}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="font-medium text-foreground">{product.title}</p>
                        <p className="text-xs text-muted-foreground">{product.categoryName ?? "Uncategorized"}</p>
                      </td>
                      <td className="p-5 text-muted-foreground">
                        {product.sellerName ?? product.sellerEmail ?? product.sellerId?.slice(0, 8)}
                      </td>
                      <td className="p-5 text-muted-foreground">{getStartingPrice(product)}</td>
                      <td className="p-5 text-muted-foreground">
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${getStatusStyle(product.status ?? product.moderation?.status)}`}>
                          {product.status ?? product.moderation?.status ?? "PENDING"}
                        </span>
                      </td>
                      <td className="p-5">
                        <Button size="sm" variant="outline" onClick={() => setSelectedProduct(product)}>
                          View Details
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
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border-soft bg-card p-6 space-y-6"
              >
                <div className="flex items-start justify-between gap-4 border-b border-border-soft pb-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">Product Review</p>
                    <h2 className="font-serif text-2xl font-light text-foreground">{selectedProduct.title}</h2>
                  </div>
                  <span className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${getStatusStyle(selectedProduct.status ?? selectedProduct.moderation?.status)}`}>
                    {selectedProduct.status ?? selectedProduct.moderation?.status ?? "PENDING"}
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Product</p>
                    <p className="text-sm text-muted-foreground">{selectedProduct.description ?? "No description provided."}</p>
                    <p className="text-sm text-muted-foreground">Category: {selectedProduct.categoryName ?? "Uncategorized"}</p>
                    <p className="text-sm text-muted-foreground">Created: {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleString("en-IN") : "—"}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Seller</p>
                    <p className="text-sm text-muted-foreground">Name: {selectedProduct.sellerName ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">Email: {selectedProduct.sellerEmail ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">Phone: {selectedProduct.sellerPhone ?? "—"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Images</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(selectedProduct.images?.length ? selectedProduct.images : ["/images/product-placeholder.svg"]).map((image) => (
                      <div key={image} className="overflow-hidden border border-border-soft bg-card">
                        <img src={image} alt={selectedProduct.title} className="h-24 w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Variants & Inventory</p>
                  {selectedProduct.variants?.length ? (
                    <div className="space-y-2">
                      {selectedProduct.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between border border-border-soft p-3 text-sm">
                          <span className="text-foreground">{variant.sku}</span>
                          <span className="text-muted-foreground">₹{Number(variant.price).toLocaleString("en-IN")}</span>
                          <span className="text-muted-foreground">Stock: {variant.stock ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No variants found.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="Reason for rejection (required to reject)"
                    value={reasons[selectedProduct.id] ?? ""}
                    onChange={(event) =>
                      setReasons((prev) => ({
                        ...prev,
                        [selectedProduct.id]: event.target.value,
                      }))
                    }
                    className="min-h-24"
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await handleApprove(selectedProduct.id);
                        setSelectedProduct(null);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await handleReject(selectedProduct.id);
                        setSelectedProduct(null);
                      }}
                      className="text-muted-foreground hover:text-[#7A5656] hover:border-[#A67575]/40"
                    >
                      Reject
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
