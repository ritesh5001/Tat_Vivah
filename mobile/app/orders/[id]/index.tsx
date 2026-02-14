import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  type ListRenderItemInfo,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import {
  getBuyerOrderDetail,
  type BuyerOrderDetail,
  type OrderItem,
} from "../../../src/services/orders";
import { getPaymentDetails } from "../../../src/services/payments";
import { useAuth } from "../../../src/hooks/useAuth";
import { useToast } from "../../../src/providers/ToastProvider";
import { ApiError, isAbortError } from "../../../src/services/api";
import { SkeletonBlock } from "../../../src/components/Skeleton";
import { AnimatedPressable } from "../../../src/components/AnimatedPressable";
import { DeliveredShimmer } from "../../../src/components/DeliveredShimmer";
import { impactLight } from "../../../src/utils/haptics";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// ---------------------------------------------------------------------------
// Memoised sub-components
// ---------------------------------------------------------------------------

const OrderItemRow = React.memo(function OrderItemRow({
  item,
}: {
  item: OrderItem;
}) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.productTitle ?? "Product"}</Text>
        <Text style={styles.itemSku}>
          {item.variantSku ?? "—"} × {item.quantity}
        </Text>
      </View>
      <Text style={styles.itemPrice}>
        {currency.format(item.priceSnapshot * item.quantity)}
      </Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PLACED: { label: "Order Placed", color: colors.gold },
  PROCESSING: { label: "Processing", color: "#5A8F5A" },
  SHIPPED: { label: "Shipped", color: "#4A7FB8" },
  DELIVERED: { label: "Delivered", color: "#5A8F5A" },
  CANCELLED: { label: "Cancelled", color: "#A65D57" },
};

function getStatusInfo(status: string) {
  return STATUS_LABELS[status] ?? { label: status, color: colors.brownSoft };
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id: orderId } = useLocalSearchParams<{ id: string }>();
  const { session, isLoading: authLoading } = useAuth();
  const token = session?.accessToken ?? null;
  const { showToast } = useToast();

  const [order, setOrder] = React.useState<BuyerOrderDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = React.useState<string | null>(null);

  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---- Fetch order detail ----
  const fetchOrder = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!orderId || !token) return;
      if (!opts?.silent) setLoading(true);
      setError(null);

      const controller = new AbortController();
      try {
        const [orderRes, paymentRes] = await Promise.all([
          getBuyerOrderDetail(orderId, token, controller.signal),
          getPaymentDetails(orderId, token).catch(() => null),
        ]);
        if (!mountedRef.current) return;
        setOrder(orderRes.order);
        setPaymentStatus(paymentRes?.data?.status ?? null);
      } catch (err) {
        if (isAbortError(err) || !mountedRef.current) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load order";
        setError(msg);
        if (opts?.silent) showToast(msg, "error");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [orderId, token, showToast]
  );

  React.useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchOrder();
  }, [authLoading, token, router, fetchOrder]);

  const onRefresh = React.useCallback(() => {
    impactLight();
    setRefreshing(true);
    fetchOrder({ silent: true });
  }, [fetchOrder]);

  // ---- Item list callbacks ----
  const itemKeyExtractor = React.useCallback((item: OrderItem) => item.id, []);

  const renderOrderItem = React.useCallback(
    ({ item }: ListRenderItemInfo<OrderItem>) => <OrderItemRow item={item} />,
    []
  );

  // ---- Derived ----
  const statusInfo = order ? getStatusInfo(order.status) : null;
  const isDelivered = order?.status === "DELIVERED";
  const showPaymentWarning =
    order?.status === "PLACED" &&
    paymentStatus != null &&
    paymentStatus !== "SUCCESS";

  // ---- Loading ----
  if (loading && !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.skeletonWrap}>
          <SkeletonBlock width="60%" height={16} />
          <SkeletonBlock width="30%" height={12} style={{ marginTop: spacing.sm }} />
          <SkeletonBlock width="100%" height={60} style={{ marginTop: spacing.md }} />
          <SkeletonBlock width="100%" height={60} style={{ marginTop: spacing.sm }} />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Error ----
  if (error && !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.centerCard}>
          <Text style={styles.errorTitle}>Unable to load order</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.primaryButton} onPress={() => fetchOrder()}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
          />
        }
      >
        {/* Status banner */}
        {showPaymentWarning && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              Payment pending — complete your payment to confirm this order.
            </Text>
          </View>
        )}

        {/* Order summary card */}
        <DeliveredShimmer active={isDelivered}>
          <View style={[
            styles.card,
            isDelivered && { borderColor: colors.gold, borderWidth: 1.5 },
          ]}>
          <View style={styles.summaryRow}>
            <Text style={styles.orderId}>
              Order {order.id.slice(0, 8).toUpperCase()}
            </Text>
            {statusInfo && (
              <Text style={[styles.statusBadge, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            )}
          </View>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {currency.format(order.totalAmount)}
            </Text>
          </View>
        </View>
        </DeliveredShimmer>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Items ({order.items.length})
          </Text>
          <FlatList
            data={order.items}
            keyExtractor={itemKeyExtractor}
            renderItem={renderOrderItem}
            scrollEnabled={false}
            initialNumToRender={10}
          />
        </View>

        {/* Shipping address */}
        {order.shippingAddressLine1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            {order.shippingName && (
              <Text style={styles.addressLine}>{order.shippingName}</Text>
            )}
            <Text style={styles.addressLine}>
              {order.shippingAddressLine1}
            </Text>
            {order.shippingAddressLine2 && (
              <Text style={styles.addressLine}>
                {order.shippingAddressLine2}
              </Text>
            )}
            {order.shippingCity && (
              <Text style={styles.addressLine}>{order.shippingCity}</Text>
            )}
            {order.shippingPhone && (
              <Text style={styles.addressMeta}>
                Phone: {order.shippingPhone}
              </Text>
            )}
            {order.shippingEmail && (
              <Text style={styles.addressMeta}>
                Email: {order.shippingEmail}
              </Text>
            )}
            {order.shippingNotes && (
              <Text style={styles.addressMeta}>
                Notes: {order.shippingNotes}
              </Text>
            )}
          </View>
        )}

        {/* Track order button */}
        <AnimatedPressable
          style={styles.primaryButton}
          onPress={() => router.push(`/orders/${orderId}/tracking`)}
        >
          <Text style={styles.primaryButtonText}>Track Shipment</Text>
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backText: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.brownSoft,
  },
  headerTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Warning
  warningBanner: {
    backgroundColor: "#FFF3E0",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  warningText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: "#E65100",
    lineHeight: 18,
  },

  // Cards
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  sectionTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  statusBadge: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  orderDate: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
  totalLabel: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  totalValue: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
  },

  // Items
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemTitle: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: colors.charcoal,
  },
  itemSku: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: colors.charcoal,
  },

  // Address
  addressLine: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 20,
  },
  addressMeta: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    marginTop: spacing.xs,
  },

  // Buttons
  primaryButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },

  // Skeleton
  skeletonWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Error
  centerCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    ...shadow.card,
  },
  errorTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
