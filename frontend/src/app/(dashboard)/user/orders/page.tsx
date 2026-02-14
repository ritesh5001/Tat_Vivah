"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { listBuyerOrders } from "@/services/orders";
import { getPaymentDetails } from "@/services/payments";
import { toast } from "sonner";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getStatusStyle = (status: string) => {
  // Calm, desaturated status colors - never loud
  switch (status.toUpperCase()) {
    case "DELIVERED":
      return "border-[#7B9971]/30 text-[#5A7352] bg-[#7B9971]/5";
    case "CONFIRMED":
      return "border-[#B7956C]/30 text-[#8A7054] bg-[#B7956C]/5";
    case "SHIPPED":
      return "border-[#8B9CB8]/30 text-[#5E6B82] bg-[#8B9CB8]/5";
    case "PLACED":
      return "border-border-soft text-muted-foreground bg-cream/30";
    case "PAYMENT PENDING":
      return "border-[#B7956C]/40 text-[#8A7054] bg-[#B7956C]/10";
    case "PAYMENT FAILED":
      return "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5";
    case "CANCELLED":
      return "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5";
    default:
      return "border-border-soft text-muted-foreground bg-cream/30";
  }
};

export default function UserOrdersPage() {
  const [orders, setOrders] = React.useState<Array<any>>([]);
  const [loading, setLoading] = React.useState(true);
  const [paymentStatusByOrder, setPaymentStatusByOrder] = React.useState<
    Record<string, string>
  >({});

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await listBuyerOrders();
        const nextOrders = result.orders ?? [];
        setOrders(nextOrders);

        const statuses = await Promise.all(
          nextOrders.map(async (order: any) => {
            try {
              const payment = await getPaymentDetails(order.id);
              return [order.id, payment.data?.status ?? ""] as const;
            } catch {
              return [order.id, ""] as const;
            }
          })
        );

        const statusMap = statuses.reduce((acc, [orderId, status]) => {
          acc[orderId] = status;
          return acc;
        }, {} as Record<string, string>);

        setPaymentStatusByOrder(statusMap);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load orders"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
            Order History
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Your Purchases
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Track the journey of your curated pieces from our heritage artisans.
          </p>
        </div>

        {/* Orders List */}
        <section className="space-y-6">
          {loading ? (
            <div className="border border-border-soft bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="border border-border-soft bg-card p-12 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Your order history is waiting to be written.
              </p>
              <Link href="/marketplace">
                <Button>Discover Collections</Button>
              </Link>
            </div>
          ) : (
            orders.map((order, index) => {
              const paymentStatus = paymentStatusByOrder[order.id];
              let label = order.status;
              if (order.status === "PLACED") {
                if (paymentStatus === "FAILED") {
                  label = "PAYMENT FAILED";
                } else if (paymentStatus && paymentStatus !== "SUCCESS") {
                  label = "PAYMENT PENDING";
                }
              }

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
                  className="border border-border-soft bg-card"
                >
                  {/* Order Header */}
                  <div className="flex flex-col gap-4 p-6 border-b border-border-soft sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-serif text-lg font-normal text-foreground">
                        Order {order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {order.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${getStatusStyle(label)}`}>
                        {label}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/user/orders/${order.id}`}>
                          Track Order
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid gap-px bg-border-soft sm:grid-cols-3">
                    <div className="bg-card p-6 space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Placed On
                      </p>
                      <p className="font-medium text-foreground">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "—"}
                      </p>
                    </div>
                    <div className="bg-card p-6 space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Items
                      </p>
                      <p className="font-medium text-foreground">
                        {order.items?.length ?? 0} {order.items?.length === 1 ? "piece" : "pieces"}
                      </p>
                    </div>
                    <div className="bg-card p-6 space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Total
                      </p>
                      <p className="font-serif text-lg font-light text-foreground">
                        {currency.format(order.totalAmount ?? 0)}
                      </p>
                    </div>
                  </div>

                  {/* Order Summary Footer */}
                  <div className="p-6 border-t border-border-soft">
                    <div className="grid gap-6 sm:grid-cols-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Subtotal
                        </p>
                        <p className="text-foreground">
                          {currency.format(
                            (order.items ?? []).reduce(
                              (sum: number, item: any) =>
                                sum + (item.priceSnapshot ?? 0) * (item.quantity ?? 0),
                              0
                            )
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Shipping
                        </p>
                        <p className="text-foreground">
                          {currency.format(
                            Math.max(
                              (order.totalAmount ?? 0) -
                              (order.items ?? []).reduce(
                                (sum: number, item: any) =>
                                  sum +
                                  (item.priceSnapshot ?? 0) *
                                  (item.quantity ?? 0),
                                0
                              ),
                              0
                            )
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Grand Total
                        </p>
                        <p className="font-medium text-foreground">
                          {currency.format(order.totalAmount ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </section>
      </motion.div>
    </div>
  );
}
