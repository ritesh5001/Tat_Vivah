import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  type ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { listBuyerOrders, type BuyerOrder } from "../../../src/services/orders";
import { getPaymentDetails } from "../../../src/services/payments";
import { useAuth } from "../../../src/hooks/useAuth";
import { usePathname, useRouter } from "expo-router";
import { isAbortError } from "../../../src/services/api";
import { SkeletonOrderRow } from "../../../src/components/Skeleton";
import { AnimatedPressable } from "../../../src/components/AnimatedPressable";

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
}: {
  order: BuyerOrder;
  paymentLabel: string;
  paymentStyle: { color: string };
  onPress: (id: string) => void;
}) {
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
    </AnimatedPressable>
  );
});

export default function OrdersScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading: authLoading } = useAuth();
  const token = session?.accessToken ?? null;
  const [orders, setOrders] = React.useState<BuyerOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = React.useState<Record<string, string>>({});

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

  const handleOrderPress = React.useCallback(
    (orderId: string) => {
      router.push(`/orders/${orderId}`);
    },
    [router]
  );

  const renderOrderItem = React.useCallback(
    ({ item }: ListRenderItemInfo<BuyerOrder>) => {
      const payment = paymentStatus[item.id];
      const label = getPaymentLabel(item.status, payment);
      return (
        <OrderCard
          order={item}
          paymentLabel={label}
          paymentStyle={getStatusStyle(label)}
          onPress={handleOrderPress}
        />
      );
    },
    [paymentStatus, handleOrderPress]
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
});
