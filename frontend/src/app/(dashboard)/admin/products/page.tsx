"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteProduct, getAllProducts, setProductPrice } from "@/services/admin";
import { getCategories } from "@/services/catalog";
import { toast } from "sonner";

const getProductStatusStyle = (product: any) => {
  if (product.deletedByAdmin) {
    return "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5";
  }
  if (String(product.status ?? "").toUpperCase() === "APPROVED") {
    return "border-[#7B9971]/30 text-[#5A7352] bg-[#7B9971]/5";
  }
  if (String(product.status ?? "").toUpperCase() === "REJECTED") {
    return "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5";
  }
  return "border-border-soft text-muted-foreground bg-cream/30";
};

const getProductStatusLabel = (product: any) => {
  if (product.deletedByAdmin) return "DELETED";
  const status = String(product.status ?? "").toUpperCase();
  if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") return status;
  if (product.isPublished) return "PUBLISHED";
  return "DRAFT";
};

export default function AdminProductsPage() {
  const [loading, setLoading] = React.useState(true);
  const [products, setProducts] = React.useState<Array<any>>([]);
  const [reasons, setReasons] = React.useState<Record<string, string>>({});
  const [categories, setCategories] = React.useState<Array<{ id: string; name: string }>>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [selectedProduct, setSelectedProduct] = React.useState<any | null>(null);
  const [adminPriceInput, setAdminPriceInput] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [result, categoryResult] = await Promise.all([
        getAllProducts(),
        getCategories(),
      ]);
      setProducts(result.products ?? []);
      setCategories(categoryResult.categories ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load products"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    const reason = reasons[id];
    try {
      await deleteProduct(id, reason);
      toast.success("Product deleted by admin.");
      setReasons((prev) => ({ ...prev, [id]: "" }));
      load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete product"
      );
    }
  };

  const openApproveModal = (product: any) => {
    setSelectedProduct(product);
    const initialPrice =
      product.adminListingPrice != null
        ? String(product.adminListingPrice)
        : product.sellerPrice != null
          ? String(product.sellerPrice)
          : "";
    setAdminPriceInput(initialPrice);
  };

  const submitApproval = async () => {
    if (!selectedProduct) return;
    const nextPrice = Number(adminPriceInput);
    if (Number.isNaN(nextPrice) || nextPrice <= 0) {
      toast.error("Enter a valid admin listing price.");
      return;
    }
    const sellerPrice = Number(selectedProduct.sellerPrice ?? 0);
    if (sellerPrice > 0 && nextPrice < sellerPrice) {
      toast.error("Admin listing price cannot be lower than seller price.");
      return;
    }

    try {
      await setProductPrice(selectedProduct.id, nextPrice);
      toast.success("Product approved successfully.");
      setSelectedProduct(null);
      setAdminPriceInput("");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to approve product"
      );
    }
  };

  const filteredProducts = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        categoryFilter === "all" || product.categoryId === categoryFilter;

      if (!query) {
        return matchesCategory;
      }

      const haystack = [
        product.title,
        product.sellerEmail,
        product.categoryName,
        product.sellerId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && haystack.includes(query);
    });
  }, [products, searchQuery, categoryFilter]);

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
            Catalog Control
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Product Management
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Sellers can publish instantly. Use admin controls to remove listings if needed.
          </p>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="border border-border-soft bg-card p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, seller, or category..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 h-10"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Category
            </label>
            <select
              className="h-10 border border-border-soft bg-card px-4 text-sm text-foreground transition focus:border-gold/50"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="border border-border-soft bg-card"
        >
          <div className="border-b border-border-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Catalog
                </p>
                <p className="font-serif text-lg font-light text-foreground">
                  All Products
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} listings
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No products found.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-soft">
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Title
                    </th>
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Seller
                    </th>
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Category
                    </th>
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Status
                    </th>
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.02, duration: 0.3 }}
                      className="hover:bg-cream/30 dark:hover:bg-brown/10 transition-colors duration-200"
                    >
                      <td className="p-6 font-medium text-foreground">
                        {product.title}
                      </td>
                      <td className="p-6 text-muted-foreground">
                        {product.sellerEmail ?? product.sellerId?.slice(0, 8)}
                      </td>
                      <td className="p-6 text-muted-foreground">
                        {product.categoryName ?? product.categoryId?.slice(0, 6)}
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${getProductStatusStyle(product)}`}>
                          {getProductStatusLabel(product)}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-2 min-w-40">
                          {String(product.status ?? "").toUpperCase() === "PENDING" && !product.deletedByAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openApproveModal(product)}
                              className="h-9"
                            >
                              Approve
                            </Button>
                          ) : null}
                          <Input
                            placeholder="Reason for removal"
                            value={reasons[product.id] ?? ""}
                            onChange={(event) =>
                              setReasons((prev) => ({
                                ...prev,
                                [product.id]: event.target.value,
                              }))
                            }
                            className="h-9 text-xs"
                            disabled={product.deletedByAdmin}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(product.id)}
                            disabled={product.deletedByAdmin}
                            className="h-9 text-muted-foreground hover:text-[#7A5656] hover:border-[#A67575]/40"
                          >
                            {product.deletedByAdmin ? "Deleted" : "Remove"}
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </motion.div>

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
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg border border-border-soft bg-card p-6 space-y-5"
            >
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
                  Approval
                </p>
                <h2 className="font-serif text-2xl font-light text-foreground">
                  {selectedProduct.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Seller price: {Number(selectedProduct.sellerPrice ?? 0) || "—"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Admin listing price
                </p>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={adminPriceInput}
                  onChange={(event) => setAdminPriceInput(event.target.value)}
                  placeholder="Enter admin listing price"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="sm" onClick={submitApproval}>
                  Approve & Set Price
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedProduct(null)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
