import * as React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Image } from "./CompatImage";
import { colors, radius, spacing, typography, shadow } from "../theme/tokens";
import { images } from "../data/images";
import { type BestsellerProduct } from "../services/bestsellers";

interface BestsellerSectionProps {
  loading: boolean;
  items: BestsellerProduct[];
  cardWidth: number;
  onPressShopAll?: () => void;
}

export function BestsellerSection({
  loading,
  items,
  cardWidth,
  onPressShopAll,
}: BestsellerSectionProps) {
  const formatPrice = (price?: number | null) => {
    if (!price && price !== 0) return "Contact for price";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionEyebrow}>Most loved</Text>
          <Text style={styles.sectionTitle}>Bestselling pieces</Text>
        </View>
        <Pressable onPress={onPressShopAll}>
          <Text style={styles.sectionLink}>Shop all</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading bestsellers...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>No bestsellers available yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, { width: cardWidth }]}>
              <Image
                source={item.image ? { uri: item.image } : images.productPlaceholder}
                style={styles.image}
                contentFit="cover"
                contentPosition="center"
                transition={200}
                cachePolicy="memory-disk"
              />
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  {formatPrice(item.salePrice ?? item.adminPrice ?? item.minPrice)}
                </Text>
                {typeof item.regularPrice === "number" &&
                typeof (item.salePrice ?? item.adminPrice ?? item.minPrice) ===
                  "number" &&
                item.regularPrice !== (item.salePrice ?? item.adminPrice ?? item.minPrice) ? (
                  <Text style={styles.priceStrike}>
                    {formatPrice(item.regularPrice)}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
  },
  headerRow: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionEyebrow: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  sectionTitle: {
    marginTop: spacing.xs,
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.charcoal,
  },
  sectionLink: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  image: {
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
  },
  title: {
    marginTop: spacing.sm,
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  priceRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  price: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.charcoal,
  },
  priceStrike: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textDecorationLine: "line-through",
  },
  loadingCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
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
