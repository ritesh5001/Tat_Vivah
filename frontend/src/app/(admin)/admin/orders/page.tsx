"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AdminOrder,
  getOrders,
  cancelOrder,
  forceConfirmOrder,
} from "@/services/admin";
import { toast } from "sonner";

const getStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "DELIVERED":
      return "border-[#7B9971]/30 text-[#5A7352] bg-[#7B9971]/5";
    case "CONFIRMED":
    case "SHIPPED":
      return "border-[#7B9971]/30 text-[#5A7352] bg-[#7B9971]/5";
    case "PLACED":
      return "border-[#B7956C]/30 text-[#8A7054] bg-[#B7956C]/5";
    case "CANCELLED":
      return "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5";
    default:
      return "border-border-soft text-muted-foreground bg-cream/30";
  }
};

export default function AdminOrdersPage() {
  const [loading, setLoading] = React.useState(true);
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOrders();
      setOrders(result.orders ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load orders"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (id: string) => {
    setProcessingId(id);
    try {
      await cancelOrder(id);
      toast.success("Order cancelled.");
      load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to cancel order"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleForceConfirm = async (id: string) => {
    setProcessingId(id);
    try {
      await forceConfirmOrder(id);
      toast.success("Order force-confirmed.");
      load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to force-confirm order"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search.trim() ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      String(o.totalAmount).includes(search);
    const matchesStatus =
      !statusFilter || o.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

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
            Commerce Operations
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Order Management
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Review, cancel, or force-confirm platform orders with full administrative control.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by order ID or amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 border border-border-soft bg-card px-3 text-sm text-foreground"
          >
            <option value="">All Statuses</option>
            {statuses.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="border border-border-soft bg-card"
        >
          <div className="border-b border-border-soft p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">
              Ledger
            </p>
            <p className="font-serif text-lg font-light text-foreground">
              All Orders ({filtered.length})
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No orders found.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-soft">
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Order ID
                    </th>
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Amount
                    </th>
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Items
                    </th>
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Status
                    </th>
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Date
                    </th>
                    <th className="p-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {filtered.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.03, duration: 0.3 }}
                      className="hover:bg-cream/30 dark:hover:bg-brown/10 transition-colors duration-200"
                    >
                      <td className="p-6 font-mono text-xs font-medium text-foreground">
                        {order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="p-6 font-medium text-foreground">
                        ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="p-6 text-muted-foreground">
                        {order.items?.length ?? 0}
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${getStatusStyle(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-6 text-muted-foreground">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(order.id)}
                            disabled={
                              order.status === "CANCELLED" ||
                              order.status === "DELIVERED" ||
                              processingId === order.id
                            }
                            className="h-9 text-muted-foreground hover:text-[#7A5656] hover:border-[#A67575]/40"
                          >
                            {processingId === order.id ? "Processing..." : "Cancel"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleForceConfirm(order.id)}
                            disabled={
                              order.status !== "PLACED" ||
                              processingId === order.id
                            }
                            className="h-9"
                          >
                            {processingId === order.id ? "Processing..." : "Force Confirm"}
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
    </div>
  );
}
