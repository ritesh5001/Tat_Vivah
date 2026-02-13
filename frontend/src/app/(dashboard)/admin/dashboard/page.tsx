"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AdminProduct,
  AdminSeller,
  getAllProducts,
  getOrders,
  getPayments,
  getSellers,
} from "@/services/admin";
import { toast } from "sonner";

const getStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "border-[#7B9971]/30 text-[#5A7352]";
    case "PENDING":
      return "border-[#B8956C]/30 text-[#8A7054]";
    case "SUSPENDED":
      return "border-[#A67575]/30 text-[#7A5656]";
    default:
      return "border-border-soft text-muted-foreground";
  }
};

export default function AdminOverviewPage() {
  const [stats, setStats] = React.useState({
    sellers: 0,
    products: 0,
    orders: 0,
    payments: 0,
  });
  const [recentSellers, setRecentSellers] = React.useState<AdminSeller[]>([]);
  const [recentProducts, setRecentProducts] = React.useState<AdminProduct[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [sellerRes, productsRes, ordersRes, paymentsRes] =
          await Promise.all([
            getSellers(),
            getAllProducts(),
            getOrders(),
            getPayments(),
          ]);
        setStats({
          sellers: sellerRes.sellers?.length ?? 0,
          products: productsRes.products?.length ?? 0,
          orders: ordersRes.orders?.length ?? 0,
          payments: paymentsRes.payments?.length ?? 0,
        });
        setRecentSellers((sellerRes.sellers ?? []).slice(0, 5));
        setRecentProducts((productsRes.products ?? []).slice(0, 5));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load admin stats"
        );
      }
    };
    load();
  }, []);

  const highlights = [
    { label: "Verified Sellers", value: String(stats.sellers), description: "Active on platform" },
    { label: "Listed Products", value: String(stats.products), description: "In catalog" },
    { label: "Total Orders", value: String(stats.orders), description: "Processed" },
    { label: "Payments", value: String(stats.payments), description: "Transactions" },
  ];

  const complianceItems = [
    { label: "Approval workflow", count: "Enabled" },
    { label: "Admin removals", count: "Manual" },
    { label: "Customer reviews", count: "Monitored" },
  ];

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:py-20"
      >
        {/* Header */}
        <div className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
            Platform Administration
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Governance Console
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Oversee seller ecosystem, merchandising compliance, and platform health with trust and authority.
          </p>
        </div>

        {/* Stats Grid - Platform Insights */}
        <section className="grid gap-px bg-border-soft sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
              className="bg-card p-6 space-y-3"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold">
                {item.label}
              </p>
              <div className="space-y-1">
                <p className="font-serif text-2xl font-light text-foreground">
                  {item.value}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Compliance & Actions Row */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Compliance Checks */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-2 border border-border-soft bg-card"
          >
            <div className="flex items-center justify-between border-b border-border-soft p-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Attention Required
                </p>
                <p className="font-serif text-lg font-light text-foreground">
                  Compliance Checks
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/products">Review Catalog</Link>
              </Button>
            </div>
            <div className="divide-y divide-border-soft">
              {complianceItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.05, duration: 0.4 }}
                  className="flex items-center justify-between p-6"
                >
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="px-3 py-1 text-xs font-medium border border-gold/30 text-[#8A7054] bg-gold/5">
                    {item.count}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="border border-border-soft bg-card h-fit"
          >
            <div className="border-b border-border-soft p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Moderation
              </p>
              <p className="font-serif text-lg font-light text-foreground">
                Admin Actions
              </p>
            </div>
            <div className="p-6 space-y-3">
              <Link href="/admin/sellers">
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center justify-between py-3 px-4 border border-border-soft text-sm text-foreground transition-all duration-300 hover:border-gold/50 hover:bg-cream/50 dark:hover:bg-brown/20"
                >
                  <span>Approve Vendor</span>
                  <span className="text-muted-foreground">→</span>
                </motion.div>
              </Link>
              <Link href="/admin/moderation">
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center justify-between py-3 px-4 border border-border-soft text-sm text-foreground transition-all duration-300 hover:border-gold/50 hover:bg-cream/50 dark:hover:bg-brown/20"
                >
                  <span>Approval Requests</span>
                  <span className="text-muted-foreground">→</span>
                </motion.div>
              </Link>
              <Link href="/admin/security">
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center justify-between py-3 px-4 border border-border-soft text-sm text-foreground transition-all duration-300 hover:border-gold/50 hover:bg-cream/50 dark:hover:bg-brown/20"
                >
                  <span>Send Audit</span>
                  <span className="text-muted-foreground">→</span>
                </motion.div>
              </Link>
              <Link href="/admin/bestsellers">
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center justify-between py-3 px-4 border border-border-soft text-sm text-foreground transition-all duration-300 hover:border-gold/50 hover:bg-cream/50 dark:hover:bg-brown/20"
                >
                  <span>Manage Bestsellers</span>
                  <span className="text-muted-foreground">→</span>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Recent Activity Grid */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Recent Sellers */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="border border-border-soft bg-card"
          >
            <div className="flex items-center justify-between border-b border-border-soft p-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Onboarding
                </p>
                <p className="font-serif text-lg font-light text-foreground">
                  Recent Sellers
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/sellers">View All</Link>
              </Button>
            </div>
            <div className="divide-y divide-border-soft">
              {recentSellers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No sellers found.</p>
                </div>
              ) : (
                recentSellers.map((seller, index) => (
                  <motion.div
                    key={seller.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.04, duration: 0.4 }}
                    className="flex items-center justify-between gap-4 p-6"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {seller.email ?? seller.phone ?? seller.id?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {seller.createdAt
                          ? new Date(seller.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "—"}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${getStatusStyle(seller.status)}`}>
                      {seller.status}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Products */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="border border-border-soft bg-card"
          >
            <div className="flex items-center justify-between border-b border-border-soft p-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Catalog
                </p>
                <p className="font-serif text-lg font-light text-foreground">
                  Recent Products
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/products">View All</Link>
              </Button>
            </div>
            <div className="divide-y divide-border-soft">
              {recentProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No products found.</p>
                </div>
              ) : (
                recentProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 + index * 0.04, duration: 0.4 }}
                    className="flex items-center justify-between gap-4 p-6"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {product.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.categoryName ?? product.categoryId?.slice(0, 6)}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${product.deletedByAdmin
                        ? "border-[#A67575]/30 text-[#7A5656]"
                        : product.isPublished
                          ? "border-[#7B9971]/30 text-[#5A7352]"
                          : "border-border-soft text-muted-foreground"
                      }`}>
                      {product.deletedByAdmin
                        ? "Deleted"
                        : product.isPublished
                          ? "Published"
                          : "Draft"}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </section>
      </motion.div>
    </div>
  );
}
