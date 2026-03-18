import React, { useMemo } from "react";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useProductsQuery } from "../hooks/useProductsQuery";
import { colors, spacing, textStyles } from "../theme";
import { CachedImage } from "./CachedImage";

const fallbackImage = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80";

export function MostLovedList() {
  const { data, isLoading, isError } = useProductsQuery({ page: 1, limit: 10, sort: "popular" });
  const { height } = useWindowDimensions();
  const feedWrapHeight = Math.max(520, Math.round(height * 0.78));
  const imageHeight = Math.max(400, Math.round(feedWrapHeight * 0.82));

  const products = useMemo(() => data?.data ?? [], [data?.data]);

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.placeholderWrap}>
        <Text style={[textStyles.bodyTextSecondary, styles.placeholderText]}>Loading products...</Text>
      </View>
    );
  }

  if (isError && products.length === 0) {
    return (
      <View style={styles.placeholderWrap}>
        <Text style={[textStyles.bodyTextSecondary, styles.placeholderText]}>
          Unable to load products right now.
        </Text>
      </View>
    );
  }

  const formatPrice = (price?: number) => {
    if (typeof price !== "number") return "₹0";
    return `₹${price.toLocaleString("en-IN")}`;
  };

  return (
    <View style={[styles.feedWrap, { height: feedWrapHeight }]}> 
      <View style={styles.listContent}>
        {products.map((item) => (
          <View key={item.id} style={styles.feedCard}>
            <View style={styles.imageWrap}>
              <CachedImage source={item.images?.[0] ?? fallbackImage} style={[styles.feedImage, { height: imageHeight }]} />
              <Pressable style={styles.heartButton}>
                <Feather name="heart" size={18} color={colors.white} />
              </Pressable>
            </View>
            <Text numberOfLines={2} style={[textStyles.productTitle, styles.productTitle]}>{item.title}</Text>
            <Text style={[textStyles.bodyText, styles.productPrice]}>{formatPrice(item.price)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: spacing.md,
  },
  feedWrap: {
    height: 560,
  },
  placeholderWrap: {
    minHeight: 80,
    justifyContent: "center",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  feedCard: {
    width: "100%",
  },
  imageWrap: {
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    position: "relative",
  },
  feedImage: {
    width: "100%",
    height: 460,
  },
  heartButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  productTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },
  productPrice: {
    marginTop: spacing.xs,
    color: colors.textPrimary,
  },
});
