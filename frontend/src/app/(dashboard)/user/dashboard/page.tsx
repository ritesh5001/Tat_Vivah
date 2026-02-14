"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { listBuyerOrders } from "@/services/orders";
import { toast } from "sonner";

const quickLinks = [
  { label: "Browse Marketplace", href: "/marketplace", description: "Discover curated collections" },
  { label: "Saved Vendors", href: "/vendors", description: "Your trusted artisans" },
  { label: "My Orders", href: "/user/orders", description: "Track your journey" },
  { label: "My Profile", href: "/user/profile", description: "Account details" },
];

const getStatusStyle = (status: string) => {
  // Calm, desaturated status colors - never loud
  switch (status.toUpperCase()) {
    case "DELIVERED":
      return "border-[#7B9971]/30 text-[#5A7352] bg-[#7B9971]/5";
    case "CONFIRMED":
      return "border-[#B7956C]/30 text-[#8A7054] bg-[#B7956C]/5";
    case "SHIPPED":
      return "border-[#8B9CB8]/30 text-[#5E6B82] bg-[#8B9CB8]/5";
    case "CANCELLED":
      return "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5";
    default:
      return "border-border-soft text-muted-foreground bg-cream/30";
  }
};

export default function UserDashboardPage() {
  const [user, setUser] = React.useState<{
    email?: string | null;
    phone?: string | null;
  } | null>(null);
  const [orders, setOrders] = React.useState<
    Array<{ id: string; status: string; item: string }>
  >([]);

  React.useEffect(() => {
    const match = document.cookie.match(/(?:^|; )tatvivah_user=([^;]*)/);
    if (match) {
      try {
        setUser(JSON.parse(decodeURIComponent(match[1])));
      } catch {
        setUser(null);
      }
    }
  }, []);

  React.useEffect(() => {
    const loadOrders = async () => {
      try {
        const result = await listBuyerOrders();
        const mapped = (result.orders ?? []).slice(0, 3).map((order) => ({
          id: order.id,
          status: order.status,
          item: `Order ${order.id.slice(0, 6).toUpperCase()}`,
        }));
        setOrders(mapped);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load orders"
        );
      }
    };
    loadOrders();
  }, []);

  const displayName = user?.email ?? user?.phone ?? "Customer";

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:py-20"
      >
        {/* Welcome Header */}
        <div className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
            Personal Account
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Welcome, {displayName}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Track your orders, manage saved items, and discover new collections from trusted artisans.
          </p>
        </div>

        {/* Quick Links - Gentle Invitations */}
        <section className="grid gap-px bg-border-soft sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
            >
              <Link href={link.href}>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-card p-6 space-y-2 h-full transition-all duration-300 hover:bg-cream/50 dark:hover:bg-brown/20"
                >
                  <p className="text-sm font-medium text-foreground">
                    {link.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {link.description}
                  </p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </section>

        {/* Main Content Grid */}
        <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Recent Orders - Personal Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="border border-border-soft bg-card"
          >
            <div className="border-b border-border-soft p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Your Journey
              </p>
              <p className="font-serif text-lg font-light text-foreground">
                Recent Orders
              </p>
            </div>

            <div className="divide-y divide-border-soft">
              {orders.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Your order history will appear here.
                  </p>
                  <Link href="/marketplace">
                    <Button variant="outline" size="sm">
                      Explore Collections
                    </Button>
                  </Link>
                </div>
              ) : (
                orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.4 }}
                    className="flex items-center justify-between gap-4 p-6"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {order.item}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {order.id}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Actions - Confident Not Pushy */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="border border-border-soft bg-card h-fit"
          >
            <div className="border-b border-border-soft p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">
                At Your Service
              </p>
              <p className="font-serif text-lg font-light text-foreground">
                Quick Actions
              </p>
            </div>

            <div className="p-6 space-y-3">
              <Link href="/user/orders">
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center justify-between py-3 px-4 border border-border-soft text-sm text-foreground transition-all duration-300 hover:border-gold/50 hover:bg-cream/50 dark:hover:bg-brown/20"
                >
                  <span>Track Order</span>
                  <span className="text-muted-foreground">→</span>
                </motion.div>
              </Link>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-center justify-between py-3 px-4 border border-border-soft text-sm text-foreground cursor-pointer transition-all duration-300 hover:border-gold/50 hover:bg-cream/50 dark:hover:bg-brown/20"
              >
                <span>Request Support</span>
                <span className="text-muted-foreground">→</span>
              </motion.div>
              <Link href="/marketplace">
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Button className="w-full h-12">
                    Continue Shopping
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Trust Footer */}
        <section className="border-t border-border-soft pt-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Verified Artisans
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Secure Payments
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Buyer Protection
            </span>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
