import * as React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { colors, radius, spacing, typography } from "../theme/tokens";
import {
  getProductsAndCache,
  getProductsCached,
  type ProductItem,
} from "../services/products";
import { ProductGridCard } from "../components/ProductGridCard";

const LIMIT = 8;

export function NewArrivalsScreen() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<ProductItem[]>([]);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const params = { page: 1, limit: LIMIT };
      const cached = await getProductsCached(params);
      const hadCache = Boolean(cached?.data?.length);
      if (cached && active) {
        setItems(cached.data ?? []);
        setLoading(false);
      }
      try {
        const response = await getProductsAndCache(params);
        if (active) {
          setItems(response.data ?? []);
        }
      } catch (error) {
        console.error("[new-arrivals] load failed", error);
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

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.column}
      contentContainerStyle={styles.container}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={7}
      removeClippedSubviews
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.eyebrow}>New arrivals</Text>
          <Text style={styles.title}>The Heritage Collection</Text>
          <Text style={styles.copy}>
            Limited edition pieces crafted by third-generation artisans, curated
            for modern celebrations.
          </Text>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Loading new arrivals...</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No new arrivals yet.</Text>
          </View>
        )
      }
      renderItem={({ item }) => <ProductGridCard product={item} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  column: {
    gap: spacing.md,
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
    fontSize: 26,
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
});
