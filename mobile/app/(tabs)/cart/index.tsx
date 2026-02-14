import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { getCart, updateCartItem, removeCartItem, type CartItemDetails } from "../../../src/services/cart";
import { useAuth } from "../../../src/hooks/useAuth";
import { isAbortError } from "../../../src/services/api";
import { SkeletonCartRow } from "../../../src/components/Skeleton";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function CartScreen() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const token = session?.accessToken ?? null;
  const [items, setItems] = React.useState<CartItemDetails[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadCart = React.useCallback(async () => {
    if (authLoading) {
      return;
    }
    if (!token) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    try {
      const result = await getCart(token);
      setItems(result.cart.items ?? []);
    } catch (err) {
      if (!isAbortError(err)) setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, router, authLoading]);

  React.useEffect(() => {
    if (!authLoading) {
      loadCart();
    }
  }, [authLoading, loadCart]);

  const handleQty = async (itemId: string, nextQty: number) => {
    if (!token) return;
    if (nextQty <= 0) {
      await handleRemove(itemId);
      return;
    }
    await updateCartItem(itemId, nextQty, token);
    await loadCart();
  };

  const handleRemove = async (itemId: string) => {
    if (!token) return;
    await removeCartItem(itemId, token);
    await loadCart();
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.priceSnapshot * item.quantity,
    0
  );
  const shipping = items.length ? 180 : 0;
  const total = subtotal + shipping;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <Text style={styles.headerCopy}>Review your curated selection.</Text>
      </View>

      {loading || authLoading ? (
        <View style={styles.listContent}>
          <SkeletonCartRow />
          <SkeletonCartRow />
          <SkeletonCartRow />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Your cart is empty.</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/search")}
          >
            <Text style={styles.primaryButtonText}>Explore collection</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            windowSize={5}
            removeClippedSubviews
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.product?.title ?? "Item"}</Text>
                  <Text style={styles.itemMeta}>Variant · {item.variant?.sku ?? "—"}</Text>
                  <Text style={styles.itemPrice}>
                    {currency.format(item.priceSnapshot)}
                  </Text>
                </View>
                <View style={styles.qtyRow}>
                  <Pressable
                    style={styles.qtyButton}
                    onPress={() => handleQty(item.id, item.quantity - 1)}
                  >
                    <Text style={styles.qtyButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <Pressable
                    style={styles.qtyButton}
                    onPress={() => handleQty(item.id, item.quantity + 1)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </Pressable>
                </View>
                <Pressable style={styles.removeButton} onPress={() => handleRemove(item.id)}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              </View>
            )}
          />

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{currency.format(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>{currency.format(shipping)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotal}>{currency.format(total)}</Text>
            </View>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/checkout")}
            >
              <Text style={styles.primaryButtonText}>Proceed to checkout</Text>
            </Pressable>
          </View>
        </>
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
  itemCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  itemInfo: {
    marginBottom: spacing.sm,
  },
  itemTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  itemMeta: {
    marginTop: 4,
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
  },
  itemPrice: {
    marginTop: spacing.xs,
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.charcoal,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  qtyButton: {
    height: 32,
    width: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 16,
    color: colors.charcoal,
  },
  qtyValue: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.charcoal,
  },
  removeButton: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  removeButtonText: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.gold,
  },
  summaryCard: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  summaryValue: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.charcoal,
  },
  summaryTotal: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
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
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    ...shadow.card,
  },
  emptyTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
    marginBottom: spacing.md,
  },
});
