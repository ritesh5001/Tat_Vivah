import * as React from "react";
import { View, Text, StyleSheet, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "./CompatImage";
import { colors, typography, spacing } from "../theme/tokens";
import { images } from "../data/images";
import { type ProductItem } from "../services/products";

interface ProductGridCardProps {
  product: ProductItem;
  onBuyNow?: (product: ProductItem) => void;
  onExplore?: (product: ProductItem) => void;
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

function ProductGridCardComponent({
  product,
  onExplore,
  style,
}: ProductGridCardProps) {
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

  const handlePress = () => onExplore?.(product);

  return (
    <Pressable style={[styles.card, style]} onPress={handlePress}>
      <View style={styles.imageWrap}>
        <Image
          source={firstImage ? { uri: firstImage } : images.productPlaceholder}
          style={styles.image}
          contentFit="cover"
          contentPosition="center"
          transition={200}
          cachePolicy="memory-disk"
        />

        <View style={styles.trendingBadge}>
          <Text style={styles.trendingText}>TRENDING</Text>
        </View>

        {discountPercent !== null ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
          </View>
        ) : null}

        <View style={styles.ratingPill}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
          <Text style={styles.ratingDivider}>|</Text>
          <Text style={styles.ratingCount}>{reviewCount}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.categoryLabel} numberOfLines={1}>
          {(product.category?.name ?? "Collection").toUpperCase()}
        </Text>

        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        {typeof primaryPrice === "number" ? (
          <View style={styles.priceRow}>
            <Text style={styles.price}>{currency.format(primaryPrice)}</Text>
            {typeof originalPrice === "number" ? (
              <Text style={styles.priceStrike}>{currency.format(originalPrice)}</Text>
            ) : null}
            {discountPercent !== null ? (
              <Text style={styles.discountText}>({discountPercent}% OFF)</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.priceUnavailable}>Price on request</Text>
        )}

        <Pressable style={styles.ctaButton} onPress={handlePress}>
          <Text style={styles.ctaButtonText}>ADD TO CART</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export const ProductGridCard = React.memo(ProductGridCardComponent);

const TRENDING_BG = "rgba(255,255,255,0.95)";
const RATING_BG = "rgba(255,255,255,0.92)";
const DISCOUNT_AMBER = "#B45309";
const DISCOUNT_BADGE_BG = "#D97706";
const STAR_GREEN = "#16A34A";

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    shadowColor: colors.charcoal,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: colors.surface,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  trendingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: TRENDING_BG,
  },
  trendingText: {
    fontFamily: typography.sansMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.charcoal,
    fontWeight: "700",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: DISCOUNT_BADGE_BG,
  },
  discountBadgeText: {
    fontFamily: typography.sansMedium,
    fontSize: 9,
    letterSpacing: 0.8,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  ratingPill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RATING_BG,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  ratingStar: {
    color: STAR_GREEN,
    fontSize: 11,
    lineHeight: 12,
  },
  ratingValue: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.charcoal,
    fontWeight: "600",
  },
  ratingDivider: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    marginHorizontal: 1,
  },
  ratingCount: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
  },
  info: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.md,
    gap: 4,
  },
  categoryLabel: {
    fontFamily: typography.sansMedium,
    fontSize: 9.5,
    letterSpacing: 1.3,
    color: colors.brownSoft,
    fontWeight: "600",
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 14,
    color: colors.charcoal,
    fontWeight: "600",
    lineHeight: 18,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    marginTop: 2,
    gap: 6,
  },
  price: {
    fontFamily: typography.sansMedium,
    fontSize: 14,
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
    marginTop: spacing.sm,
    height: 36,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
