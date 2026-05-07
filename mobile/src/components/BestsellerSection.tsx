import * as React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { colors, spacing, typography } from "../theme/tokens";
import { type BestsellerProduct } from "../services/bestsellers";
import { type ProductItem } from "../services/products";
import { ProductGridCard } from "./ProductGridCard";

interface BestsellerSectionProps {
  loading: boolean;
  items: BestsellerProduct[];
  cardWidth: number;
  onPressShopAll?: () => void;
  onPressItem?: (product: ProductItem) => void;
}

function bestsellerToProductItem(item: BestsellerProduct): ProductItem {
  return {
    id: item.productId || item.id,
    title: item.title,
    images: item.image ? [item.image] : [],
    category: item.categoryName ? { name: item.categoryName } : null,
    price: item.adminPrice ?? item.minPrice ?? undefined,
    salePrice: item.salePrice ?? null,
    adminPrice: item.adminPrice ?? null,
    regularPrice: item.regularPrice ?? null,
    sellerPrice: null,
  };
}

export function BestsellerSection({
  loading,
  items,
  cardWidth,
  onPressShopAll,
  onPressItem,
}: BestsellerSectionProps) {
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
          removeClippedSubviews
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={30}
          initialNumToRender={4}
          windowSize={5}
          getItemLayout={(_data, index) => {
            const itemWidth = cardWidth + spacing.md;
            return { length: itemWidth, offset: itemWidth * index, index };
          }}
          renderItem={({ item }) => (
            <ProductGridCard
              product={bestsellerToProductItem(item)}
              onExplore={onPressItem}
              style={{ width: cardWidth, flex: 0 }}
            />
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
  loadingCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
});
