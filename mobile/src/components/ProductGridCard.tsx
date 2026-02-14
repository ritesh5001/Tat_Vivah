import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { colors, typography } from "../theme/tokens";
import { images } from "../data/images";
import { type ProductItem } from "../services/products";

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
  const formatPrice = (price?: number | null) => {
    if (!price && price !== 0) return "Price on request";
    return currency.format(price);
  };

  const primaryPrice =
    product.salePrice ?? product.adminPrice ?? product.price ?? product.sellerPrice;

  return (
    <View style={styles.card}>
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
          <View style={[styles.badgePill, styles.badgePillAccent]}>
            <Text style={[styles.badgeText, styles.badgeTextAccent]}>Verified</Text>
          </View>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(primaryPrice)}</Text>
          {typeof product.regularPrice === "number" &&
          typeof primaryPrice === "number" &&
          product.regularPrice !== primaryPrice ? (
            <Text style={styles.priceStrike}>{formatPrice(product.regularPrice)}</Text>
          ) : null}
        </View>
        <View style={styles.actionRow}>
          <Pressable
            style={styles.buyButton}
            onPress={() => onBuyNow?.(product)}
          >
            <Text style={styles.buyButtonText}>Buy now</Text>
          </Pressable>
          <Pressable
            style={styles.exploreButton}
            onPress={() => onExplore?.(product)}
          >
            <Text style={styles.exploreButtonText}>Explore</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export const ProductGridCard = React.memo(ProductGridCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    shadowColor: "#2C2825",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 1,
  },
  imageWrap: {
    height: 230,
    backgroundColor: colors.cream,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  badgeRow: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  badgePillAccent: {
    backgroundColor: "rgba(44, 40, 37, 0.8)",
    borderColor: "rgba(44, 40, 37, 0.7)",
  },
  badgeText: {
    fontFamily: typography.serif,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.brownSoft,
  },
  badgeTextAccent: {
    color: colors.warmWhite,
  },
  info: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 17,
    color: colors.charcoal,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  price: {
    fontFamily: typography.serif,
    fontSize: 14,
    color: colors.charcoal,
  },
  priceStrike: {
    fontFamily: typography.serif,
    fontSize: 12,
    color: colors.brownSoft,
    textDecorationLine: "line-through",
  },
  actionRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  buyButton: {
    flex: 1,
    backgroundColor: colors.charcoal,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  buyButtonText: {
    fontFamily: typography.serif,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.background,
  },
  exploreButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  exploreButtonText: {
    fontFamily: typography.serif,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.charcoal,
  },
});
