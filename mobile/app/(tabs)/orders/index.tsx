import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { listBuyerOrders, type BuyerOrder } from "../../../src/services/orders";
import { getPaymentDetails } from "../../../src/services/payments";
import { useAuth } from "../../../src/hooks/useAuth";
import { useRouter } from "expo-router";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function OrdersScreen() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const token = session?.accessToken ?? null;
  const [orders, setOrders] = React.useState<BuyerOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [paymentStatus, setPaymentStatus] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const load = async () => {
      if (authLoading) {
        return;
      }
      if (!token) {
        router.replace("/login");
        return;
      }
      setLoading(true);
      try {
        const result = await listBuyerOrders(token);
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

        const map = statuses.reduce((acc, [orderId, status]) => {
          acc[orderId] = status;
          return acc;
        }, {} as Record<string, string>);
        setPaymentStatus(map);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, token, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Orders</Text>
        <Text style={styles.headerCopy}>Track your curated purchases.</Text>
      </View>

      {loading || authLoading ? (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>No orders yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const payment = paymentStatus[item.id];
            const label =
              item.status === "PLACED" && payment && payment !== "SUCCESS"
                ? "PAYMENT PENDING"
                : item.status;
            return (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderTitle}>
                    Order {item.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={styles.orderStatus}>{label}</Text>
                </View>
                <Text style={styles.orderMeta}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </Text>
                <Text style={styles.orderTotal}>
                  {currency.format(item.totalAmount ?? 0)}
                </Text>
              </View>
            );
          }}
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
});
