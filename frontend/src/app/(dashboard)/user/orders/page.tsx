"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { listBuyerOrders, downloadInvoice } from "@/services/orders";
import { getPaymentDetails, retryPayment, verifyPayment } from "@/services/payments";
import { listMyCancellations, requestCancellation } from "@/services/cancellations";
import { listMyReturns, requestReturn } from "@/services/returns";
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
  const router = useRouter();
  const [orders, setOrders] = React.useState<Array<any>>([]);
  const [loading, setLoading] = React.useState(true);
  const [retryingOrderId, setRetryingOrderId] = React.useState<string | null>(null);
  const [requestingCancellationIds, setRequestingCancellationIds] = React.useState<Set<string>>(new Set());
  const [cancellationByOrderId, setCancellationByOrderId] = React.useState<Record<string, { id: string; status: string }>>({});
  const [cancelModalOrderId, setCancelModalOrderId] = React.useState<string | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [paymentStatusByOrder, setPaymentStatusByOrder] = React.useState<
    Record<string, string>
  >({});
  // Return state
  const [returnByOrderId, setReturnByOrderId] = React.useState<Record<string, { id: string; status: string }>>({});
  const [returnModalOrderId, setReturnModalOrderId] = React.useState<string | null>(null);
  const [returnReason, setReturnReason] = React.useState("");
  const [requestingReturnIds, setRequestingReturnIds] = React.useState<Set<string>>(new Set());
  const [downloadingInvoiceId, setDownloadingInvoiceId] = React.useState<string | null>(null);

  // Ensure Razorpay SDK is loaded when page mounts
  const razorpayReadyRef = React.useRef(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).Razorpay) {
      razorpayReadyRef.current = true;
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => { razorpayReadyRef.current = true; };
    document.body.appendChild(script);
  }, []);

  const loadOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listBuyerOrders();
      const nextOrders = result.orders ?? [];
      setOrders(nextOrders);

      try {
        const cancellationResult = await listMyCancellations();
        const nextMap: Record<string, { id: string; status: string }> = {};
        for (const cancellation of cancellationResult.cancellations ?? []) {
          nextMap[cancellation.orderId] = {
            id: cancellation.id,
            status: cancellation.status,
          };
        }
        setCancellationByOrderId(nextMap);
      } catch {
        // silent fallback
      }

      try {
        const returnResult = await listMyReturns();
        const returnMap: Record<string, { id: string; status: string }> = {};
        for (const ret of returnResult.returns ?? []) {
          returnMap[ret.orderId] = { id: ret.id, status: ret.status };
        }
        setReturnByOrderId(returnMap);
      } catch {
        // silent fallback
      }

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
  }, []);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // ---- Retry payment handler ----
  const handleRetryPayment = React.useCallback(async (orderId: string) => {
    if (retryingOrderId) return; // prevent double-click
    if (!razorpayReadyRef.current) {
      toast.error("Payment gateway is loading. Please wait.");
      return;
    }

    setRetryingOrderId(orderId);
    try {
      const paymentResult = await retryPayment(orderId);
      const data = paymentResult.data;

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
            // Refresh order list to reflect new status
            loadOrders();
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Payment verification failed"
            );
          }
        },
        modal: {
          ondismiss: () => {
            toast.message("Payment still pending. You can retry anytime.");
          },
        },
        theme: { color: "#B7956C" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to retry payment"
      );
    } finally {
      setRetryingOrderId(null);
    }
  }, [retryingOrderId, loadOrders]);

  const openCancellationModal = React.useCallback((orderId: string) => {
    setCancelModalOrderId(orderId);
    setCancelReason("");
  }, []);

  const closeCancellationModal = React.useCallback(() => {
    setCancelModalOrderId(null);
    setCancelReason("");
  }, []);

  const handleRequestCancellation = React.useCallback(async () => {
    if (!cancelModalOrderId) return;
    const reason = cancelReason.trim();
    if (!reason) {
      toast.error("Please enter a cancellation reason");
      return;
    }

    setRequestingCancellationIds((prev) => new Set(prev).add(cancelModalOrderId));
    try {
      await requestCancellation(cancelModalOrderId, reason);
      setCancellationByOrderId((prev) => ({
        ...prev,
        [cancelModalOrderId]: {
          id: `temp-${cancelModalOrderId}`,
          status: "REQUESTED",
        },
      }));
      toast.success("Cancellation requested successfully");
      closeCancellationModal();
      loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to request cancellation");
    } finally {
      setRequestingCancellationIds((prev) => {
        const next = new Set(prev);
        next.delete(cancelModalOrderId);
        return next;
      });
    }
  }, [cancelModalOrderId, cancelReason, closeCancellationModal, loadOrders]);

  // ---- Return handlers ----
  const openReturnModal = React.useCallback((orderId: string) => {
    setReturnModalOrderId(orderId);
    setReturnReason("");
  }, []);

  const closeReturnModal = React.useCallback(() => {
    setReturnModalOrderId(null);
    setReturnReason("");
  }, []);

  const handleRequestReturn = React.useCallback(async () => {
    if (!returnModalOrderId) return;
    const reason = returnReason.trim();
    if (!reason) {
      toast.error("Please enter a return reason");
      return;
    }

    const order = orders.find((o: any) => o.id === returnModalOrderId);
    if (!order?.items?.length) {
      toast.error("No items found for this order");
      return;
    }

    // Return all items by default (full return)
    const items = (order.items as any[]).map((item: any) => ({
      orderItemId: item.id,
      quantity: item.quantity,
    }));

    setRequestingReturnIds((prev) => new Set(prev).add(returnModalOrderId));
    try {
      await requestReturn(returnModalOrderId, reason, items);
      setReturnByOrderId((prev) => ({
        ...prev,
        [returnModalOrderId]: { id: `temp-${returnModalOrderId}`, status: "REQUESTED" },
      }));
      toast.success("Return requested successfully");
      closeReturnModal();
      loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to request return");
    } finally {
      setRequestingReturnIds((prev) => {
        const next = new Set(prev);
        next.delete(returnModalOrderId);
        return next;
      });
    }
  }, [returnModalOrderId, returnReason, orders, closeReturnModal, loadOrders]);

  // ---- Download Invoice handler ----
  const handleDownloadInvoice = React.useCallback(async (orderId: string) => {
    if (downloadingInvoiceId) return;
    setDownloadingInvoiceId(orderId);
    try {
      await downloadInvoice(orderId);
      toast.success("Invoice downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download invoice");
    } finally {
      setDownloadingInvoiceId(null);
    }
  }, [downloadingInvoiceId]);

  return (
    <>
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
              const saleSubtotal = (order.items ?? []).reduce(
                (sum: number, item: any) =>
                  sum + (item.priceSnapshot ?? 0) * (item.quantity ?? 0),
                0
              );
              const regularSubtotal = (order.items ?? []).reduce(
                (sum: number, item: any) =>
                  sum +
                  ((item.sellerPriceSnapshot ?? item.priceSnapshot ?? 0) *
                    (item.quantity ?? 0)),
                0
              );
              const shippingAmount = Math.max((order.totalAmount ?? 0) - saleSubtotal, 0);
              const regularGrandTotal = regularSubtotal + shippingAmount;
              let label = order.status;
              const cancellationStatus =
                cancellationByOrderId[order.id]?.status ?? order.cancellationRequest?.status;
              const hasCancellationRequest = cancellationStatus === "REQUESTED";
              const shipmentStatus = order.shipmentStatus ?? null;
              const canRequestCancellation =
                (order.status === "PLACED" || order.status === "CONFIRMED") &&
                shipmentStatus !== "SHIPPED" &&
                !hasCancellationRequest;
              const requestingCancellation = requestingCancellationIds.has(order.id);
              // Return eligibility
              const returnStatus = returnByOrderId[order.id]?.status;
              const hasReturnRequest = !!returnStatus && returnStatus !== "REJECTED";
              const canRequestReturn =
                order.status === "DELIVERED" && !hasReturnRequest;
              const requestingReturn = requestingReturnIds.has(order.id);
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
                      {hasCancellationRequest ? (
                        <span className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border border-[#B7956C]/30 text-[#8A7054] bg-[#B7956C]/5">
                          Cancellation Requested
                        </span>
                      ) : null}
                      {canRequestCancellation ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={requestingCancellation}
                          onClick={() => openCancellationModal(order.id)}
                        >
                          {requestingCancellation ? "Requesting..." : "Request Cancellation"}
                        </Button>
                      ) : null}
                      {hasReturnRequest ? (
                        <span className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border border-[#8B9CB8]/30 text-[#5E6B82] bg-[#8B9CB8]/5">
                          Return {returnStatus}
                        </span>
                      ) : null}
                      {canRequestReturn ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={requestingReturn}
                          onClick={() => openReturnModal(order.id)}
                        >
                          {requestingReturn ? "Requesting..." : "Request Return"}
                        </Button>
                      ) : null}
                      {(label === "PAYMENT FAILED" || label === "PAYMENT PENDING") && (
                        <Button
                          size="sm"
                          onClick={() => handleRetryPayment(order.id)}
                          disabled={retryingOrderId === order.id}
                        >
                          {retryingOrderId === order.id ? "Retrying..." : "Retry Payment"}
                        </Button>
                      )}
                      {/* Download Invoice — available for confirmed/shipped/delivered orders */}
                      {(order.status === "CONFIRMED" || order.status === "SHIPPED" || order.status === "DELIVERED") && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingInvoiceId === order.id}
                          onClick={() => handleDownloadInvoice(order.id)}
                        >
                          {downloadingInvoiceId === order.id ? "Downloading..." : "Download Invoice"}
                        </Button>
                      )}
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
                      <div className="space-y-1">
                        <p className="font-serif text-lg font-light text-foreground">
                          {currency.format(order.totalAmount ?? 0)}
                        </p>
                        {regularGrandTotal !== (order.totalAmount ?? 0) ? (
                          <p className="text-xs text-muted-foreground line-through">
                            {currency.format(regularGrandTotal)}
                          </p>
                        ) : null}
                      </div>
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
                          {currency.format(saleSubtotal)}
                        </p>
                        {regularSubtotal !== saleSubtotal ? (
                          <p className="text-xs text-muted-foreground line-through">
                            {currency.format(regularSubtotal)}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Shipping
                        </p>
                        <p className="text-foreground">
                          {currency.format(shippingAmount)}
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

      {cancelModalOrderId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md border border-border-soft bg-card p-6 space-y-4">
            <h2 className="font-serif text-xl text-foreground">Request Cancellation</h2>
            <p className="text-sm text-muted-foreground">
              Please share the reason for cancelling this order.
            </p>
            <Textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Enter your cancellation reason"
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeCancellationModal}>
                Close
              </Button>
              <Button
                onClick={handleRequestCancellation}
                disabled={!cancelReason.trim() || requestingCancellationIds.has(cancelModalOrderId)}
              >
                {requestingCancellationIds.has(cancelModalOrderId) ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {returnModalOrderId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md border border-border-soft bg-card p-6 space-y-4">
            <h2 className="font-serif text-xl text-foreground">Request Return</h2>
            <p className="text-sm text-muted-foreground">
              Please share the reason for returning this order. All items will be included.
            </p>
            <Textarea
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
              placeholder="Enter your return reason (e.g., wrong size, damaged item)"
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeReturnModal}>
                Close
              </Button>
              <Button
                onClick={handleRequestReturn}
                disabled={!returnReason.trim() || requestingReturnIds.has(returnModalOrderId)}
              >
                {requestingReturnIds.has(returnModalOrderId) ? "Submitting..." : "Submit Return"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
