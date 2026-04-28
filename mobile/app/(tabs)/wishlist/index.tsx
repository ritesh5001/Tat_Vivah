import * as React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  type ListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "../../../src/components/CompatImage";
import { colors, spacing, typography } from "../../../src/theme/tokens";
import { useWishlist } from "../../../src/providers/WishlistProvider";
import { useAuth } from "../../../src/hooks/useAuth";
import { type WishlistItemDetail } from "../../../src/services/wishlist";
import { AnimatedPressable } from "../../../src/components/AnimatedPressable";
import { impactLight } from "../../../src/utils/haptics";
import { AppHeader } from "../../../src/components/AppHeader";
import { TatvivahLoader } from "../../../src/components/TatvivahLoader";
import { WishlistIcon } from "../../../src/components/WishlistIcon";
import { MotionView } from "../../../src/components/motion";
import { AppText as Text, ScreenContainer as SafeAreaView } from "../../../src/components";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

// ---------------------------------------------------------------------------
// Memoised item row
// ---------------------------------------------------------------------------

const WishlistRow = React.memo(function WishlistRow({
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
  const imageUri = item.product.images?.[0] ?? fallbackImage;
  const price = item.product.adminListingPrice;

  return (
    <Pressable
      onPress={() => onPress(item.productId)}
      style={styles.row}
    >
      <Image
        source={{ uri: imageUri }}
        style={styles.rowImage}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <View style={styles.rowInfo}>
        <Text style={styles.rowCategory} numberOfLines={1}>
          {item.product.category?.name ?? "Collection"}
        </Text>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.product.title}
        </Text>
        {typeof price === "number" ? (
          <Text style={styles.rowPrice}>{currency.format(price)}</Text>
        ) : (
          <Text style={styles.rowPriceMuted}>Price on request</Text>
        )}
      </View>
      <Pressable
        onPress={() => {
          impactLight();
          onRemove(item.productId);
        }}
        disabled={removing}
        style={styles.removeButton}
        hitSlop={8}
      >
        {removing ? (
          <TatvivahLoader size="sm" color={colors.brown} />
        ) : (
          <WishlistIcon size={20} color="#E8453C" filled />
        )}
      </Pressable>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function WishlistScreen() {
  const router = useRouter();
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
      router.push(`/product/${productId}`);
    },
    [router]
  );

  const handleRemove = React.useCallback(
    (productId: string) => {
      removeFromWishlist(productId);
    },
    [removeFromWishlist]
  );

  const renderItem = React.useCallback(
    ({ item, index }: ListRenderItemInfo<WishlistItemDetail>) => (
      <MotionView preset="slideUp" delay={Math.min(index * 24, 160)}>
        <WishlistRow
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          updateCellsBatchingPeriod={24}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    marginHorizontal: spacing.lg,
  },
  rowImage: {
    width: 80,
    height: 100,
    borderRadius: 0,
    backgroundColor: colors.surface,
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowCategory: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  rowTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  rowPrice: {
    fontFamily: typography.serif,
    fontSize: 14,
    color: colors.charcoal,
  },
  rowPriceMuted: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 0,
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
    borderRadius: 0,
  },
  secondaryButtonText: {
    fontFamily: typography.sans,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.foreground,
  },
});
