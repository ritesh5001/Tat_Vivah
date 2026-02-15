import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  type ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { listBuyerOrders, type BuyerOrder } from "../../../src/services/orders";
import { listMyCancellations, requestCancellation } from "../../../src/services/cancellations";
import { listMyReturns, requestReturn } from "../../../src/services/returns";
import { getPaymentDetails, retryPayment, verifyPayment } from "../../../src/services/payments";
import { openRazorpayCheckout } from "../../../src/services/razorpay";
import { useAuth } from "../../../src/hooks/useAuth";
import { usePathname, useRouter } from "expo-router";
import { isAbortError } from "../../../src/services/api";
import { SkeletonOrderRow } from "../../../src/components/Skeleton";
import { AnimatedPressable } from "../../../src/components/AnimatedPressable";
import { useToast } from "../../../src/providers/ToastProvider";
import { notifySuccess, notifyError, impactMedium } from "../../../src/utils/haptics";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getStatusStyle(label: string): { color: string } {
  switch (label) {
    case "DELIVERED":
      return { color: "#5A7352" };
    case "CONFIRMED":
      return { color: "#8A7054" };
    case "SHIPPED":
      return { color: "#5E6B82" };
    case "PAYMENT PENDING":
      return { color: "#8A7054" };
    case "PAYMENT FAILED":
      return { color: "#7A5656" };
    case "CANCELLED":
      return { color: "#7A5656" };
    default:
      return { color: colors.brownSoft };
  }
}

function getPaymentLabel(orderStatus: string, paymentStatus?: string): string {
  if (orderStatus !== "PLACED") return orderStatus;
  if (paymentStatus === "FAILED") return "PAYMENT FAILED";
  if (paymentStatus && paymentStatus !== "SUCCESS") return "PAYMENT PENDING";
  return orderStatus;
}

// ---------------------------------------------------------------------------
// Memoised order card
// ---------------------------------------------------------------------------

const OrderCard = React.memo(function OrderCard({
  order,
  paymentLabel,
  paymentStyle,
  onPress,
  onRetry,
  isRetrying,
  onRequestCancellation,
  isRequestingCancellation,
  showCancellationRequested,
  onRequestReturn,
  isRequestingReturn,
  returnStatus,
}: {
  order: BuyerOrder;
  paymentLabel: string;
  paymentStyle: { color: string };
  onPress: (id: string) => void;
  onRetry?: (id: string) => void;
  isRetrying?: boolean;
  onRequestCancellation?: (id: string) => void;
  isRequestingCancellation?: boolean;
  showCancellationRequested?: boolean;
  onRequestReturn?: (id: string) => void;
  isRequestingReturn?: boolean;
  returnStatus?: string | null;
}) {
  const canRetry = paymentLabel === "PAYMENT FAILED" || paymentLabel === "PAYMENT PENDING";
  const canRequestCancellation =
    (order.status === "PLACED" || order.status === "CONFIRMED") &&
    order.shipmentStatus !== "SHIPPED" &&
    !showCancellationRequested;
  const hasReturnRequest = !!returnStatus && returnStatus !== "REJECTED";
  const canRequestReturn =
    order.status === "DELIVERED" && !hasReturnRequest;

  return (
    <AnimatedPressable
      style={styles.orderCard}
      onPress={() => onPress(order.id)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>
          Order {order.id.slice(0, 8).toUpperCase()}
        </Text>
        <Text style={[styles.orderStatus, paymentStyle]}>{paymentLabel}</Text>
      </View>
      <Text style={styles.orderMeta}>
        {order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("en-IN", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "—"}
      </Text>
      <Text style={styles.orderTotal}>
        {currency.format(order.totalAmount ?? 0)}
      </Text>
      {canRetry && onRetry && (
        <Pressable
          style={[styles.retryPaymentButton, isRetrying && styles.retryPaymentButtonDisabled]}
          onPress={() => { if (!isRetrying) onRetry(order.id); }}
          disabled={isRetrying}
        >
          <Text style={styles.retryPaymentButtonText}>
            {isRetrying ? "Retrying..." : "Retry Payment"}
          </Text>
        </Pressable>
      )}
      {showCancellationRequested ? (
        <View style={styles.cancellationBadge}>
          <Text style={styles.cancellationBadgeText}>Cancellation Requested</Text>
        </View>
      ) : null}
      {canRequestCancellation && onRequestCancellation ? (
        <Pressable
          style={[styles.requestCancelButton, isRequestingCancellation && styles.retryPaymentButtonDisabled]}
          onPress={() => onRequestCancellation(order.id)}
          disabled={isRequestingCancellation}
        >
          <Text style={styles.requestCancelButtonText}>
            {isRequestingCancellation ? "Requesting..." : "Request Cancellation"}
          </Text>
        </Pressable>
      ) : null}
      {hasReturnRequest ? (
        <View style={styles.cancellationBadge}>
          <Text style={styles.cancellationBadgeText}>Return {returnStatus}</Text>
        </View>
      ) : null}
      {canRequestReturn && onRequestReturn ? (
        <Pressable
          style={[styles.requestCancelButton, isRequestingReturn && styles.retryPaymentButtonDisabled]}
          onPress={() => onRequestReturn(order.id)}
          disabled={isRequestingReturn}
        >
          <Text style={styles.requestCancelButtonText}>
            {isRequestingReturn ? "Requesting..." : "Request Return"}
          </Text>
        </Pressable>
      ) : null}
    </AnimatedPressable>
  );
});

export default function OrdersScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading: authLoading } = useAuth();
  const token = session?.accessToken ?? null;
  const { showToast } = useToast();
  const [orders, setOrders] = React.useState<BuyerOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = React.useState<Record<string, string>>({});
  const [retryingOrderId, setRetryingOrderId] = React.useState<string | null>(null);
  const [cancellationByOrder, setCancellationByOrder] = React.useState<Record<string, { id: string; status: string }>>({});
  const [cancelModalOrderId, setCancelModalOrderId] = React.useState<string | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [requestingCancellationIds, setRequestingCancellationIds] = React.useState<Set<string>>(new Set());

  const cancellationLockRef = React.useRef<Set<string>>(new Set());

  // Return state
  const [returnByOrder, setReturnByOrder] = React.useState<Record<string, { id: string; status: string }>>({});
  const [returnModalOrderId, setReturnModalOrderId] = React.useState<string | null>(null);
  const [returnReason, setReturnReason] = React.useState("");
  const [requestingReturnIds, setRequestingReturnIds] = React.useState<Set<string>>(new Set());
  const returnLockRef = React.useRef<Set<string>>(new Set());

  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const loadOrders = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setFetchError(null);
    try {
      const result = await listBuyerOrders(token);
      if (!mountedRef.current) return;
      const nextOrders = result.orders ?? [];
      setOrders(nextOrders);

      try {
        const cancellationResult = await listMyCancellations(token);
        if (!mountedRef.current) return;
        const cancellationMap = (cancellationResult.cancellations ?? []).reduce((acc, item) => {
          acc[item.orderId] = { id: item.id, status: item.status };
          return acc;
        }, {} as Record<string, { id: string; status: string }>);
        setCancellationByOrder(cancellationMap);
      } catch {
        // no-op
      }

      try {
        const returnResult = await listMyReturns(token);
        if (!mountedRef.current) return;
        const returnMap = (returnResult.returns ?? []).reduce((acc, item) => {
          acc[item.orderId] = { id: item.id, status: item.status };
          return acc;
        }, {} as Record<string, { id: string; status: string }>);
        setReturnByOrder(returnMap);
      } catch {
        // no-op
      }

      const statuses = await Promise.all(
        nextOrders.map(async (order) => {
          try {
            const payment = await getPaymentDetails(order.id, token);
            return [order.id, payment.data?.status ?? ""] as const;
          } catch {
            return [order.id, ""] as const;
          }
        })
      );

      if (!mountedRef.current) return;
      const map = statuses.reduce((acc, [orderId, status]) => {
        acc[orderId] = status;
        return acc;
      }, {} as Record<string, string>);
      setPaymentStatus(map);
    } catch (err) {
      if (!isAbortError(err) && mountedRef.current) {
        setOrders([]);
        setFetchError(
          err instanceof Error ? err.message : "Failed to load orders"
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token) {
      const returnTo = encodeURIComponent(pathname || "/orders");
      router.replace(`/login?returnTo=${returnTo}`);
      return;
    }
    loadOrders();
  }, [authLoading, token, router, loadOrders, pathname]);

  const lockCancellation = React.useCallback((orderId: string) => {
    if (cancellationLockRef.current.has(orderId)) return false;
    cancellationLockRef.current.add(orderId);
    setRequestingCancellationIds((prev) => {
      const next = new Set(prev);
      next.add(orderId);
      return next;
    });
    return true;
  }, []);

  const unlockCancellation = React.useCallback((orderId: string) => {
    cancellationLockRef.current.delete(orderId);
    setRequestingCancellationIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }, []);

  const openCancellationModal = React.useCallback((orderId: string) => {
    impactMedium();
    setCancelModalOrderId(orderId);
    setCancelReason("");
  }, []);

  const closeCancellationModal = React.useCallback(() => {
    setCancelModalOrderId(null);
    setCancelReason("");
  }, []);

  const submitCancellation = React.useCallback(async () => {
    if (!cancelModalOrderId || !token) return;
    const reason = cancelReason.trim();
    if (!reason) {
      showToast("Please enter a cancellation reason", "error");
      return;
    }

    if (!lockCancellation(cancelModalOrderId)) return;

    try {
      await requestCancellation(cancelModalOrderId, reason, token);
      setCancellationByOrder((prev) => ({
        ...prev,
        [cancelModalOrderId]: {
          id: `temp-${cancelModalOrderId}`,
          status: "REQUESTED",
        },
      }));
      notifySuccess();
      showToast("Cancellation requested", "success");
      closeCancellationModal();
      loadOrders();
    } catch (err) {
      notifyError();
      showToast(err instanceof Error ? err.message : "Unable to request cancellation", "error");
    } finally {
      if (mountedRef.current) {
        unlockCancellation(cancelModalOrderId);
      }
    }
  }, [cancelModalOrderId, cancelReason, closeCancellationModal, loadOrders, lockCancellation, showToast, token, unlockCancellation]);

  // ---- Return handlers ----
  const lockReturn = React.useCallback((orderId: string) => {
    if (returnLockRef.current.has(orderId)) return false;
    returnLockRef.current.add(orderId);
    setRequestingReturnIds((prev) => {
      const next = new Set(prev);
      next.add(orderId);
      return next;
    });
    return true;
  }, []);

  const unlockReturn = React.useCallback((orderId: string) => {
    returnLockRef.current.delete(orderId);
    setRequestingReturnIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }, []);

  const openReturnModal = React.useCallback((orderId: string) => {
    impactMedium();
    setReturnModalOrderId(orderId);
    setReturnReason("");
  }, []);

  const closeReturnModal = React.useCallback(() => {
    setReturnModalOrderId(null);
    setReturnReason("");
  }, []);

  const submitReturn = React.useCallback(async () => {
    if (!returnModalOrderId || !token) return;
    const reason = returnReason.trim();
    if (!reason) {
      showToast("Please enter a return reason", "error");
      return;
    }

    const order = orders.find((o) => o.id === returnModalOrderId);
    if (!order?.items?.length) {
      showToast("No items found for this order", "error");
      return;
    }

    // Return all items by default
    const items = order.items.map((item) => ({
      orderItemId: item.id,
      quantity: item.quantity,
    }));

    if (!lockReturn(returnModalOrderId)) return;

    try {
      await requestReturn(returnModalOrderId, reason, items, token);
      setReturnByOrder((prev) => ({
        ...prev,
        [returnModalOrderId]: {
          id: `temp-${returnModalOrderId}`,
          status: "REQUESTED",
        },
      }));
      notifySuccess();
      showToast("Return requested", "success");
      closeReturnModal();
      loadOrders();
    } catch (err) {
      notifyError();
      showToast(err instanceof Error ? err.message : "Unable to request return", "error");
    } finally {
      if (mountedRef.current) {
        unlockReturn(returnModalOrderId);
      }
    }
  }, [returnModalOrderId, returnReason, orders, closeReturnModal, loadOrders, lockReturn, showToast, token, unlockReturn]);

  const handleOrderPress = React.useCallback(
    (orderId: string) => {
      router.push(`/orders/${orderId}`);
    },
    [router]
  );

  // ---- Retry payment handler ----
  const handleRetryPayment = React.useCallback(async (orderId: string) => {
    if (retryingOrderId) return; // prevent double-tap
    if (!token) return;

    setRetryingOrderId(orderId);
    try {
      const paymentResult = await retryPayment(orderId, token);
      const { key, orderId: razorpayOrderId, amount, currency } = paymentResult.data;

      const razorpayResult = await openRazorpayCheckout({
        key,
        amount,
        currency,
        name: "TatVivah",
        description: "Retry Payment",
        order_id: razorpayOrderId,
        theme: { color: "#B8956C" },
      });

      await verifyPayment(
        {
          razorpayOrderId: razorpayResult.razorpay_order_id,
          razorpayPaymentId: razorpayResult.razorpay_payment_id,
          razorpaySignature: razorpayResult.razorpay_signature,
        },
        token
      );

      notifySuccess();
      showToast("Payment successful. Order confirmed.", "success");
      // Refresh orders to reflect new status
      loadOrders();
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "";
      const wasDismissedByUser = /cancel|dismiss|closed|backpress|back press/i.test(rawMessage);

      if (wasDismissedByUser) {
        showToast("Payment still pending. You can retry anytime.", "info");
      } else {
        notifyError();
        showToast(
          err instanceof Error ? err.message : "Payment failed. Please try again.",
          "error"
        );
      }
    } finally {
      if (mountedRef.current) {
        setRetryingOrderId(null);
      }
    }
  }, [retryingOrderId, token, loadOrders, showToast]);

  const renderOrderItem = React.useCallback(
    ({ item }: ListRenderItemInfo<BuyerOrder>) => {
      const payment = paymentStatus[item.id];
      const label = getPaymentLabel(item.status, payment);
      const cancellationStatus = cancellationByOrder[item.id]?.status ?? item.cancellationRequest?.status;
      const showCancellationRequested = cancellationStatus === "REQUESTED";
      const returnStatusVal = returnByOrder[item.id]?.status ?? null;
      return (
        <OrderCard
          order={item}
          paymentLabel={label}
          paymentStyle={getStatusStyle(label)}
          onPress={handleOrderPress}
          onRetry={handleRetryPayment}
          isRetrying={retryingOrderId === item.id}
          onRequestCancellation={openCancellationModal}
          isRequestingCancellation={requestingCancellationIds.has(item.id)}
          showCancellationRequested={showCancellationRequested}
          onRequestReturn={openReturnModal}
          isRequestingReturn={requestingReturnIds.has(item.id)}
          returnStatus={returnStatusVal}
        />
      );
    },
    [paymentStatus, cancellationByOrder, returnByOrder, handleOrderPress, handleRetryPayment, retryingOrderId, openCancellationModal, requestingCancellationIds, openReturnModal, requestingReturnIds]
  );

  const keyExtractorOrder = React.useCallback(
    (item: BuyerOrder) => item.id,
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Orders</Text>
        <Text style={styles.headerCopy}>Track your curated purchases.</Text>
      </View>

      {loading || authLoading ? (
        <View style={styles.listContent}>
          <SkeletonOrderRow />
          <SkeletonOrderRow />
          <SkeletonOrderRow />
        </View>
      ) : fetchError && orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{fetchError}</Text>
          <Pressable style={styles.retryButton} onPress={loadOrders}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Your purchases will appear here once you place your first order.
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => router.push("/search")}
          >
            <Text style={styles.retryButtonText}>Start shopping</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={keyExtractorOrder}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews
          renderItem={renderOrderItem}
        />
      )}

      <Modal
        visible={cancelModalOrderId !== null}
        transparent
        animationType="fade"
        onRequestClose={closeCancellationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Cancellation</Text>
            <Text style={styles.modalMessage}>
              Please tell us why you want to cancel this order.
            </Text>
            <TextInput
              style={styles.modalReasonInput}
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Enter reason"
              placeholderTextColor={colors.brownSoft}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={closeCancellationModal}>
                <Text style={styles.modalCancelText}>Close</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalConfirmButton,
                  (!cancelReason.trim() || (cancelModalOrderId ? requestingCancellationIds.has(cancelModalOrderId) : false)) && styles.retryPaymentButtonDisabled,
                ]}
                onPress={submitCancellation}
                disabled={!cancelReason.trim() || (cancelModalOrderId ? requestingCancellationIds.has(cancelModalOrderId) : false)}
              >
                {cancelModalOrderId && requestingCancellationIds.has(cancelModalOrderId) ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Submit</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={returnModalOrderId !== null}
        transparent
        animationType="fade"
        onRequestClose={closeReturnModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Return</Text>
            <Text style={styles.modalMessage}>
              Please tell us why you want to return this order. All items will be included.
            </Text>
            <TextInput
              style={styles.modalReasonInput}
              multiline
              value={returnReason}
              onChangeText={setReturnReason}
              placeholder="Enter return reason"
              placeholderTextColor={colors.brownSoft}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={closeReturnModal}>
                <Text style={styles.modalCancelText}>Close</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalConfirmButton,
                  (!returnReason.trim() || (returnModalOrderId ? requestingReturnIds.has(returnModalOrderId) : false)) && styles.retryPaymentButtonDisabled,
                ]}
                onPress={submitReturn}
                disabled={!returnReason.trim() || (returnModalOrderId ? requestingReturnIds.has(returnModalOrderId) : false)}
              >
                {returnModalOrderId && requestingReturnIds.has(returnModalOrderId) ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Submit</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: colors.charcoal,
  },
  headerCopy: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  orderCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  orderStatus: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  orderMeta: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
  },
  orderTotal: {
    marginTop: spacing.sm,
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.charcoal,
  },
  loadingCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    ...shadow.card,
  },
  loadingText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  emptyCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    ...shadow.card,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  retryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
  retryPaymentButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center" as const,
  },
  retryPaymentButtonDisabled: {
    opacity: 0.5,
  },
  retryPaymentButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    color: "#fff",
  },
  requestCancelButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    alignItems: "center",
    backgroundColor: colors.warmWhite,
  },
  requestCancelButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.charcoal,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  cancellationBadge: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    alignItems: "center",
    backgroundColor: colors.cream,
  },
  cancellationBadgeText: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brown,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    ...shadow.card,
  },
  modalTitle: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
  },
  modalMessage: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  modalReasonInput: {
    marginTop: spacing.md,
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    textAlignVertical: "top",
    fontFamily: typography.sans,
    color: colors.charcoal,
    backgroundColor: colors.background,
  },
  modalActions: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontFamily: typography.sans,
    color: colors.charcoal,
    fontSize: 12,
  },
  modalConfirmButton: {
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 84,
  },
  modalConfirmText: {
    fontFamily: typography.sansMedium,
    color: colors.background,
    fontSize: 12,
  },
});
