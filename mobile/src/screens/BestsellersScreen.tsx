import * as React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { colors, spacing, typography } from "../theme/tokens";
import {
  getBestsellersAndCache,
  getBestsellersCached,
  type BestsellerProduct,
} from "../services/bestsellers";
import { ProductGridCard } from "../components/ProductGridCard";
import { SkeletonProductCard } from "../components/Skeleton";

const gridSpacing = spacing.md;
const CARD_HEIGHT_ESTIMATE = 290;

export function BestsellersScreen() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<BestsellerProduct[]>([]);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const cached = await getBestsellersCached();
      const hadCache = Boolean(cached?.products?.length);
      if (cached?.products && active) {
        setItems(cached.products);
        setLoading(false);
      }
      try {
        const response = await getBestsellersAndCache();
        if (active) {
          setItems(response.products ?? []);
        }
      } catch (error) {
        console.error("[bestsellers] load failed", error);
        if (active && !hadCache) {
          setItems([]);
        }
      } finally {
        if (active && !hadCache) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const renderItem = React.useCallback(
    ({ item }: { item: BestsellerProduct }) => (
      <ProductGridCard
        product={{
          id: item.id,
          title: item.title,
          images: item.image ? [item.image] : undefined,
          category: { name: item.categoryName ?? "Featured" },
          regularPrice: item.regularPrice ?? null,
          salePrice: item.salePrice ?? item.adminPrice ?? item.minPrice ?? null,
        }}
      />
    ),
    []
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.column}
      contentContainerStyle={styles.container}
      initialNumToRender={4}
      maxToRenderPerBatch={5}
      updateCellsBatchingPeriod={30}
      windowSize={5}
      removeClippedSubviews
      getItemLayout={(_data, index) => {
        const rowIndex = Math.floor(index / 2);
        const rowHeight = CARD_HEIGHT_ESTIMATE + gridSpacing;
        return {
          length: rowHeight,
          offset: rowHeight * rowIndex,
          index,
        };
      }}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Most loved</Text>
          <Text style={styles.title}>Bestselling pieces</Text>
          <Text style={styles.copy}>
            Explore our most requested styles, curated from verified ateliers
            across India.
          </Text>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <View style={styles.skeletonGrid}>
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No bestsellers available yet.</Text>
          </View>
        )
      }
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  column: {
    gap: gridSpacing,
  },
  header: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  title: {
    marginTop: spacing.xs,
    fontFamily: typography.serif,
    fontSize: 28,
    color: colors.charcoal,
  },
  copy: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.brownSoft,
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
