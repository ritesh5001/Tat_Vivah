import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchProduct } from "../../../src/lib/prefetch-product";
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  type ListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, typography, radius } from "../../../src/theme/tokens";
import { useWishlist } from "../../../src/providers/WishlistProvider";
import { useAuth } from "../../../src/hooks/useAuth";
import { type WishlistItemDetail } from "../../../src/services/wishlist";
import { type ProductItem } from "../../../src/services/products";
import { AnimatedPressable } from "../../../src/components/AnimatedPressable";
import { impactLight } from "../../../src/utils/haptics";
import { AppHeader } from "../../../src/components/AppHeader";
import { TatvivahLoader } from "../../../src/components/TatvivahLoader";
import { WishlistIcon } from "../../../src/components/WishlistIcon";
import { MarketplaceCard } from "../../../src/components/MarketplaceCard";
import { MotionView } from "../../../src/components/motion";
import { AppText as Text, ScreenContainer as SafeAreaView } from "../../../src/components";

const { width: windowWidth } = Dimensions.get("window");
const wishlistCardWidth = (windowWidth - spacing.lg * 2 - spacing.md) / 2;
/** Module-level: a stable identity so React.memo on MarketplaceCard can hold. */
const wishlistCardStyle = { width: wishlistCardWidth };

// ---------------------------------------------------------------------------
// Wishlist card — uses shared MarketplaceCard with remove overlay
// ---------------------------------------------------------------------------

const WishlistCard = React.memo(function WishlistCard({
  item,
  onRemove,
  onPress,
  removing,
}: {
  item: WishlistItemDetail;
  onRemove: (productId: string) => void;
  onPress: (productId: string) => void;
  removing: boolean;
}) {
  const product: ProductItem = {
    id: item.productId,
    title: item.product.title,
    images: item.product.images,
    category: item.product.category ?? null,
    adminPrice: item.product.adminListingPrice ?? null,
    salePrice: item.product.adminListingPrice ?? null,
  } as ProductItem;

  return (
    <MarketplaceCard
      product={product}
      onPress={onPress}
      onRemove={(id) => {
        impactLight();
        onRemove(id);
      }}
      removing={removing}
      style={wishlistCardStyle}
      imageWidth={wishlistCardWidth}
    />
  );
});

/** Hoisted so the list sees one stable component type, not a new one each render. */
const WishlistSeparator = () => <View style={styles.separator} />;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function WishlistScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.accessToken ?? null;
  const {
    wishlistItems,
    isLoading,
    removeFromWishlist,
    mutatingIds,
    refreshWishlist,
    fetchError,
  } = useWishlist();

  const handlePress = React.useCallback(
    (productId: string) => {
      prefetchProduct(queryClient, productId);
      router.push(`/product/${productId}`);
    },
    [queryClient, router]
  );

  const handleRemove = React.useCallback(
    (productId: string) => {
      removeFromWishlist(productId);
    },
    [removeFromWishlist]
  );

  // Fade, not slide: a slide leaves the card off-screen until the animation
  // completes, and a recycled cell never completes it.
  const renderItem = React.useCallback(
    ({ item, index }: ListRenderItemInfo<WishlistItemDetail>) => (
      <MotionView preset="fade" delay={Math.min(index * 30, 180)}>
        <WishlistCard
          item={item}
          onRemove={handleRemove}
          onPress={handlePress}
          removing={mutatingIds.has(item.productId)}
        />
      </MotionView>
    ),
    [handleRemove, handlePress, mutatingIds]
  );

  const keyExtractor = React.useCallback(
    (item: WishlistItemDetail) => item.id,
    []
  );

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <AppHeader title="Wishlist" subtitle="Saved styles" showMenu showBack />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wishlist</Text>
        </View>
        <View style={styles.emptyWrap}>
          <WishlistIcon size={48} color={colors.brownSoft} />
          <Text style={styles.emptyTitle}>Sign in to use wishlist</Text>
          <Text style={styles.emptySubtitle}>
            Save favorites and keep them synced to your account.
          </Text>
          <AnimatedPressable
            onPress={() => router.push("/login?returnTo=%2Fwishlist")}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Sign in</Text>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => router.push("/search")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Continue browsing</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader title="Wishlist" subtitle="Saved styles" showMenu showBack />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <Text style={styles.headerSubtitle}>
          {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyWrap}>
          <TatvivahLoader label="Loading wishlist" color={colors.gold} />
        </View>
      ) : fetchError ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Unable to load wishlist</Text>
          <AnimatedPressable onPress={refreshWishlist} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Retry</Text>
          </AnimatedPressable>
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.emptyWrap}>
          <WishlistIcon size={48} color={colors.brownSoft} />
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse our collections and tap the heart to save items you love.
          </Text>
          <AnimatedPressable
            onPress={() => router.push("/search")}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Explore Shop</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          // No removeClippedSubviews: these cells carry a reanimated entering
          // animation, and detaching a view mid-animation is a native crash on
          // Android. The saving was never worth it for a two-column grid.
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          ItemSeparatorComponent={WishlistSeparator}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
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
    fontSize: 28,
    color: colors.charcoal,
  },
  headerSubtitle: {
    fontFamily: typography.sans,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.brownSoft,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  separator: {
    height: spacing.md,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: 16,
  },
  emptyTitle: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.brownSoft,
    textAlign: "center",
    lineHeight: 22,
  },
  ctaButton: {
    marginTop: 8,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  ctaButtonText: {
    fontFamily: typography.sans,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.background,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  secondaryButtonText: {
    fontFamily: typography.sans,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.foreground,
  },
});
