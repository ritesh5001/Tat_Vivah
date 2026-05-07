import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "./CompatImage";
import { colors, typography, spacing } from "../theme/tokens";
import { images } from "../data/images";
import { type ProductItem } from "../services/products";
import { useWishlist } from "../providers/WishlistProvider";

interface MarketplaceCardProps {
  product: ProductItem;
  onPress?: (id: string) => void;
  onRemove?: (id: string) => void;
  removing?: boolean;
  style?: StyleProp<ViewStyle>;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function seededRandom(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const range = (max - min) * 10;
  return min + (hash % range) / 10;
}

function MarketplaceCardComponent({
  product,
  onPress,
  onRemove,
  removing = false,
  style,
}: MarketplaceCardProps) {
  const { isWishlisted, toggleWishlist, mutatingIds } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const wishlistBusy = mutatingIds.has(product.id);

  const primaryPrice =
    product.salePrice ?? product.adminPrice ?? product.price ?? product.sellerPrice ?? null;

  const realRegularPrice =
    typeof product.regularPrice === "number" &&
    typeof primaryPrice === "number" &&
    product.regularPrice > primaryPrice
      ? product.regularPrice
      : null;

  const originalPrice = (() => {
    if (realRegularPrice !== null) return realRegularPrice;
    if (typeof primaryPrice !== "number" || primaryPrice <= 0) return null;
    const fakeDiscount = Math.round(seededRandom(product.id + "m", 50, 75));
    return Math.round(primaryPrice / (1 - fakeDiscount / 100) / 10) * 10;
  })();

  const discountPercent =
    typeof primaryPrice === "number" &&
    typeof originalPrice === "number" &&
    originalPrice > 0
      ? Math.round(((originalPrice - primaryPrice) / originalPrice) * 100)
      : null;

  const rating = Math.round(seededRandom(product.id, 39, 48)) / 10;
  const reviewCount = Math.round(seededRandom(product.id + "r", 50, 500));

  const firstImage =
    Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;

  const handlePress = () => onPress?.(product.id);
  const handleRemove = () => onRemove?.(product.id);
  const handleToggleWishlist = (e: any) => {
    e?.stopPropagation?.();
    toggleWishlist(product.id);
  };

  return (
    <Pressable style={[styles.card, style]} onPress={handlePress}>
      <View style={styles.imageWrap}>
        <Image
          source={firstImage ? { uri: firstImage } : images.productPlaceholder}
          style={styles.image}
          contentFit="contain"
          contentPosition="center"
          transition={200}
          cachePolicy="memory-disk"
        />

        {onRemove ? (
          <Pressable
            onPress={handleRemove}
            disabled={removing}
            hitSlop={8}
            style={styles.iconButton}
          >
            {removing ? (
              <ActivityIndicator size="small" color={colors.charcoal} />
            ) : (
              <Ionicons name="close" size={16} color={colors.charcoal} />
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={handleToggleWishlist}
            disabled={wishlistBusy}
            hitSlop={8}
            style={styles.iconButton}
          >
            {wishlistBusy ? (
              <ActivityIndicator size="small" color={colors.charcoal} />
            ) : (
              <Ionicons
                name={wishlisted ? "heart" : "heart-outline"}
                size={16}
                color={wishlisted ? "#E11D48" : colors.charcoal}
              />
            )}
          </Pressable>
        )}

        <View style={styles.imageFooter}>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
            <Text style={styles.ratingDivider}>|</Text>
            <Text style={styles.ratingCount}>{reviewCount}</Text>
          </View>

          {discountPercent !== null ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.brand} numberOfLines={1}>
          {(product.category?.name ?? "Tatvivah").toUpperCase()}
        </Text>

        <Text style={styles.title} numberOfLines={1}>
          {product.title}
        </Text>

        {typeof primaryPrice === "number" ? (
          <View style={styles.priceRow}>
            <Text style={styles.price}>{currency.format(primaryPrice)}</Text>
            {typeof originalPrice === "number" ? (
              <Text style={styles.priceStrike}>{currency.format(originalPrice)}</Text>
            ) : null}
            {discountPercent !== null ? (
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.priceUnavailable}>Price on request</Text>
        )}

        <Pressable style={styles.ctaButton} onPress={handlePress}>
          <Ionicons name="bag-handle-outline" size={13} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>ADD TO BAG</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export const MarketplaceCard = React.memo(MarketplaceCardComponent);

const RATING_GREEN = "#0F8A5F";
const DISCOUNT_AMBER = "#C2410C";
const DISCOUNT_BADGE_BG = "rgba(255, 255, 255, 0.96)";

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden",
    shadowColor: "#1A1410",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: colors.cream,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  iconButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A1410",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  imageFooter: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RATING_GREEN,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  ratingStar: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
  },
  ratingValue: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  ratingDivider: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
  },
  ratingCount: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: "rgba(255,255,255,0.92)",
  },
  discountBadge: {
    backgroundColor: DISCOUNT_BADGE_BG,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountBadgeText: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 0.4,
    color: DISCOUNT_AMBER,
    fontWeight: "700",
  },
  info: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.md,
    gap: 2,
  },
  brand: {
    fontFamily: typography.serif,
    fontSize: 13,
    letterSpacing: 0.6,
    color: colors.charcoal,
    fontWeight: "700",
  },
  title: {
    fontFamily: typography.sans,
    fontSize: 11.5,
    color: colors.brownSoft,
    lineHeight: 15,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
  },
  price: {
    fontFamily: typography.sansMedium,
    fontSize: 15,
    color: colors.charcoal,
    fontWeight: "700",
  },
  priceStrike: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textDecorationLine: "line-through",
  },
  discountText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: DISCOUNT_AMBER,
    fontWeight: "700",
  },
  priceUnavailable: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  ctaButton: {
    marginTop: spacing.sm + 2,
    height: 34,
    backgroundColor: "#1A1410",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ctaButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
