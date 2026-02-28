import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "./CompatImage";
import { colors, typography, spacing } from "../theme/tokens";
import { images } from "../data/images";
import { type ProductItem } from "../services/products";
import { useWishlist } from "../providers/WishlistProvider";

interface ProductGridCardProps {
  product: ProductItem;
  onBuyNow?: (product: ProductItem) => void;
  onExplore?: (product: ProductItem) => void;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function ProductGridCardComponent({
  product,
  onBuyNow,
  onExplore,
}: ProductGridCardProps) {
  const { isWishlisted, toggleWishlist, mutatingIds } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const wishlistBusy = mutatingIds.has(product.id);

  const formatPrice = (price?: number | null) => {
    if (!price && price !== 0) return "Price on request";
    return currency.format(price);
  };

  const primaryPrice =
    product.salePrice ?? product.adminPrice ?? product.price ?? product.sellerPrice;
  const regularPrice = product.regularPrice;
  const hasDiscount =
    typeof regularPrice === "number" &&
    typeof primaryPrice === "number" &&
    regularPrice > primaryPrice;
  const discountPercent = hasDiscount
    ? Math.round(((regularPrice - primaryPrice) / regularPrice) * 100)
    : null;
  const description = product.description?.trim();
  const tagLabel = discountPercent && discountPercent >= 30 ? "Hot Deal" : null;

  return (
    <Pressable
      style={styles.card}
      onPress={() => onExplore?.(product)}
    >
      <View style={styles.imageWrap}>
        <Image
          source={product.images?.[0] ? { uri: product.images[0] } : images.productPlaceholder}
          style={styles.image}
          contentFit="cover"
          contentPosition="center"
          transition={200}
          cachePolicy="memory-disk"
        />
        <View style={styles.badgeRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>
              {product.category?.name ?? "Featured"}
            </Text>
          </View>
          {discountPercent != null ? (
            <View style={[styles.badgePill, styles.badgePillAccent]}>
              <Text style={[styles.badgeText, styles.badgeTextAccent]}>
                {discountPercent}% off
              </Text>
            </View>
          ) : null}
        </View>
        {/* Wishlist heart overlay */}
        <Pressable
          onPress={() => toggleWishlist(product.id)}
          disabled={wishlistBusy}
          hitSlop={8}
          style={styles.heartOverlay}
        >
          <Text style={{ fontSize: 18, opacity: wishlistBusy ? 0.5 : 1 }}>
            {wishlisted ? "❤️" : "🤍"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.info}>
        <Text style={styles.brandText} numberOfLines={1}>
          {product.category?.name ?? "Curated edit"}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>⭐ 4.3</Text>
          <Text style={styles.ratingMeta}>| 2k</Text>
        </View>
        <View style={styles.priceRow}>
          {hasDiscount ? (
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          ) : null}
          {hasDiscount ? (
            <Text style={styles.priceStrike}>{formatPrice(regularPrice)}</Text>
          ) : null}
          <Text style={styles.price}>{formatPrice(primaryPrice)}</Text>
        </View>
        {tagLabel ? (
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{tagLabel}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export const ProductGridCard = React.memo(ProductGridCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#1E1A17",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 5,
    marginBottom: spacing.lg,
    aspectRatio: 0.68,
  },
  imageWrap: {
    flex: 3,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  badgeRow: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    gap: 6,
  },
  heartOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(32, 26, 21, 0.9)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "rgba(32, 26, 21, 0.92)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  badgePillAccent: {
    backgroundColor: "rgba(184, 149, 108, 0.16)",
    borderColor: "rgba(184, 149, 108, 0.45)",
  },
  badgeText: {
    fontFamily: typography.serif,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.brown,
  },
  badgeTextAccent: {
    color: colors.gold,
  },
  info: {
    flex: 1,
    padding: 16,
    gap: 4,
  },
  brandText: {
    fontFamily: typography.sans,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.brownSoft,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 14,
    color: "#F5F1E8",
    fontWeight: "600",
  },
  description: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: "rgba(245,241,232,0.7)",
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: "#F5F1E8",
  },
  ratingMeta: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  discountText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.gold,
  },
  price: {
    fontFamily: typography.serif,
    fontSize: 14,
    color: "#F5F1E8",
  },
  priceStrike: {
    fontFamily: typography.serif,
    fontSize: 11,
    color: colors.brownSoft,
    textDecorationLine: "line-through",
  },
  tagPill: {
    alignSelf: "flex-start",
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(184, 149, 108, 0.14)",
  },
  tagText: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
