import * as React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, typography, shadow } from "../../../src/theme/tokens";
import { useAuth } from "../../../src/hooks/useAuth";
import { useCart } from "@/src/providers/CartProvider";
import { useNetworkStatus } from "../../../src/hooks/useNetworkStatus";
import { useToast } from "../../../src/providers/ToastProvider";
import { SkeletonCartRow } from "../../../src/components/Skeleton";
import { AnimatedPressable } from "../../../src/components/AnimatedPressable";
import { impactLight } from "../../../src/utils/haptics";
import type { CartItemDetails } from "../../../src/services/cart";
import { AppHeader } from "../../../src/components/AppHeader";
import { MotionView } from "../../../src/components/motion";
import { AppText as Text, ScreenContainer as SafeAreaView } from "../../../src/components";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function CartScreen() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const token = session?.accessToken ?? null;
  const { isConnected } = useNetworkStatus();
  const { showToast } = useToast();
  const {
    cartItems,
    isLoading,
    isMutating,
    mutatingIds,
    updateQuantity,
    removeFromCart,
    refreshCart,
    fetchError,
  } = useCart();

  const handleQty = React.useCallback(
    (itemId: string, nextQty: number) => {
      if (!isConnected) {
        showToast("You're offline. Please check your connection.", "error");
        return;
      }
      impactLight();
      updateQuantity(itemId, nextQty);
    },
    [isConnected, updateQuantity, showToast]
  );

  const handleRemove = React.useCallback(
    (itemId: string) => {
      if (!isConnected) {
        showToast("You're offline. Please check your connection.", "error");
        return;
      }
      removeFromCart(itemId);
    },
    [isConnected, removeFromCart, showToast]
  );

  const handleCheckout = React.useCallback(() => {
    if (!isConnected) {
      showToast("You're offline. Please check your connection.", "error");
      return;
    }
    if (isMutating) {
      showToast("Cart is updating. Please wait.", "info");
      return;
    }
    if (cartItems.length === 0) return;
    router.push("/checkout");
  }, [isConnected, isMutating, cartItems.length, router, showToast]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.priceSnapshot * item.quantity,
    0
  );
  const shipping = cartItems.length ? 180 : 0;
  const gst = cartItems.length ? 180 : 0;
  const total = subtotal + shipping + gst;

  const renderItem = React.useCallback(
    ({ item, index }: { item: CartItemDetails; index: number }) => {
      const locked = mutatingIds.has(item.id);
      return (
        <MotionView preset="slideUp" delay={Math.min(index * 24, 180)}>
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>
                {item.product?.title ?? "Item"}
              </Text>
              <Text style={styles.itemMeta}>
                Variant · {item.variant?.sku ?? "—"}
              </Text>
              <Text style={styles.itemPrice}>
                {currency.format(item.priceSnapshot)}
              </Text>
            </View>
            <View style={styles.qtyRow}>
              <Pressable
                style={[styles.qtyButton, locked && styles.qtyButtonDisabled]}
                onPress={() => handleQty(item.id, item.quantity - 1)}
                disabled={locked}
              >
                <Text style={styles.qtyButtonText}>−</Text>
              </Pressable>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <Pressable
                style={[styles.qtyButton, locked && styles.qtyButtonDisabled]}
                onPress={() => handleQty(item.id, item.quantity + 1)}
                disabled={locked}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.removeButton}
              onPress={() => handleRemove(item.id)}
              disabled={locked}
            >
              <Text
                style={[
                  styles.removeButtonText,
                  locked && { opacity: 0.4 },
                ]}
              >
                {locked ? "Updating…" : "Remove"}
              </Text>
            </Pressable>
          </View>
        </MotionView>
      );
    },
    [mutatingIds, handleQty, handleRemove]
  );

  const keyExtractor = React.useCallback(
    (item: CartItemDetails) => item.id,
    []
  );

  const showSkeleton = (isLoading || authLoading) && cartItems.length === 0;

  if (!authLoading && !token) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Your Cart" showMenu showBack showWishlist showCart />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerCopy}>Review your curated selection.</Text>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Discover our premium collection and add something beautiful.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/search")}
          >
            <Text style={styles.primaryButtonText}>Continue Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Your Cart" showMenu showBack showWishlist showCart />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <Text style={styles.headerCopy}>Review your curated selection.</Text>
      </View>

      {showSkeleton ? (
        <View style={styles.listContent}>
          <SkeletonCartRow />
          <SkeletonCartRow />
          <SkeletonCartRow />
        </View>
      ) : fetchError && cartItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{fetchError}</Text>
          <Pressable style={styles.primaryButton} onPress={refreshCart}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Discover our premium collection and add something beautiful.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/search")}
          >
            <Text style={styles.primaryButtonText}>Continue Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            initialNumToRender={6}
            maxToRenderPerBatch={2}
            windowSize={3}
            updateCellsBatchingPeriod={24}
            removeClippedSubviews
          />

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {currency.format(subtotal)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {currency.format(shipping)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST</Text>
              <Text style={styles.summaryValue}>{currency.format(gst)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotal}>
                {currency.format(total)}
              </Text>
            </View>
            <AnimatedPressable
              style={[
                styles.primaryButton,
                (isMutating || cartItems.length === 0 || !isConnected) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleCheckout}
              disabled={isMutating || cartItems.length === 0 || !isConnected}
            >
              <Text style={styles.primaryButtonText}>
                {!isConnected
                  ? "Offline"
                  : isMutating
                    ? "Updating cart\u2026"
                    : "Proceed to checkout"}
              </Text>
            </AnimatedPressable>
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
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
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
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  itemCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 0,
    backgroundColor: colors.surfaceElevated,
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
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonDisabled: {
    opacity: 0.35,
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
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    backgroundColor: colors.surfaceElevated,
    ...shadow.card,
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
    fontSize: 20,
    color: colors.charcoal,
  },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 0,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
  emptyCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: 0,
    backgroundColor: colors.surfaceElevated,
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
});
