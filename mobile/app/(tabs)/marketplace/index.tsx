import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { AppHeader } from "../../../src/components/AppHeader";
import { getCategories, type Category } from "../../../src/services/catalog";
import {
  getProductsAndCache,
  getProductsCached,
  type ProductItem,
} from "../../../src/services/products";
import { ProductGridCard } from "../../../src/components/ProductGridCard";
import { isAbortError } from "../../../src/services/api";

const LIMIT = 12;

export default function MarketplaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; q?: string }>();
  const initialCategoryId =
    typeof params.categoryId === "string" ? params.categoryId : undefined;
  const initialSearch = typeof params.q === "string" ? params.q : "";

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [categoryId, setCategoryId] = React.useState<string | undefined>(initialCategoryId);
  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [search, setSearch] = React.useState(initialSearch);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const controllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await getCategories();
        if (!controller.signal.aborted) {
          setCategories(response.categories ?? []);
        }
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) {
          setCategories([]);
        }
      }
    })();
    return () => controller.abort();
  }, []);

  const loadProducts = React.useCallback(
    async (nextPage: number, replace: boolean) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (replace) {
        setLoading(true);
        setFetchError(null);
      } else {
        setLoadingMore(true);
      }

      const paramsKey = {
        page: nextPage,
        limit: LIMIT,
        categoryId,
        search: search.trim() || undefined,
      };

      const cached = await getProductsCached(paramsKey);
      const hadCache = Boolean(cached?.data?.length);
      if (cached && replace && hadCache) {
        setProducts(cached.data as ProductItem[]);
        setPage(cached.pagination?.page ?? nextPage);
        setTotalPages(cached.pagination?.totalPages ?? 1);
        setLoading(false);
      }

      try {
        const response = await getProductsAndCache({
          ...paramsKey,
          page: nextPage,
        });
        if (controller.signal.aborted) return;
        const nextItems = response.data ?? [];
        setProducts((prev) => (replace ? (nextItems as ProductItem[]) : [...prev, ...(nextItems as ProductItem[])]));
        setPage(response.pagination?.page ?? nextPage);
        setTotalPages(response.pagination?.totalPages ?? 1);
      } catch (err) {
        if (isAbortError(err)) return;
        const message = err instanceof Error ? err.message : "Failed to load products";
        setFetchError(message);
        if (replace && !hadCache) setProducts([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [categoryId, search]
  );

  React.useEffect(() => {
    setPage(1);
    loadProducts(1, true);
  }, [categoryId, search, loadProducts]);

  const handleSearch = React.useCallback(() => {
    setPage(1);
    setSearch(searchInput.trim());
  }, [searchInput]);

  const handleCategorySelect = React.useCallback((next?: string) => {
    setCategoryId(next);
  }, []);

  const handleLoadMore = React.useCallback(() => {
    if (loadingMore || loading) return;
    if (page >= totalPages) return;
    loadProducts(page + 1, false);
  }, [loadingMore, loading, page, totalPages, loadProducts]);

  const handleProductPress = React.useCallback(
    (product: ProductItem) => {
      router.push(`/product/${product.id}`);
    },
    [router]
  );

  const renderItem = React.useCallback(
    ({ item }: { item: ProductItem }) => (
      <View style={styles.productCardWrap}>
        <ProductGridCard
          product={item}
          onExplore={() => handleProductPress(item)}
          onBuyNow={() => handleProductPress(item)}
        />
      </View>
    ),
    [handleProductPress]
  );

  const ListHeader = (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>TatVivah marketplace</Text>
      <Text style={styles.title}>Discover premium curated collections</Text>
      <Text style={styles.copy}>
        Verified sellers, authentic craftsmanship, and trusted checkout in one
        destination.
      </Text>

      <View style={styles.searchCard}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search collections, styles..."
          placeholderTextColor={colors.brownSoft}
          style={styles.searchInput}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        <Pressable
          style={[styles.filterChip, !categoryId && styles.filterChipActive]}
          onPress={() => handleCategorySelect(undefined)}
        >
          <Text
            style={[styles.filterText, !categoryId && styles.filterTextActive]}
          >
            All
          </Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={[
              styles.filterChip,
              categoryId === category.id && styles.filterChipActive,
            ]}
            onPress={() => handleCategorySelect(category.id)}
          >
            <Text
              style={[
                styles.filterText,
                categoryId === category.id && styles.filterTextActive,
              ]}
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Marketplace" subtitle="Premium curated catalog" showMenu showBack />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.container}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator color={colors.gold} />
              <Text style={styles.emptyText}>Loading marketplace...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {fetchError ?? "No products found. Try adjusting your search."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : page < totalPages ? (
            <Pressable style={styles.loadMoreButton} onPress={handleLoadMore}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    gap: spacing.md,
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
    color: colors.brownSoft,
    lineHeight: 20,
  },
  searchCard: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
    ...shadow.card,
  },
  searchInput: {
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.charcoal,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingBottom: spacing.sm,
  },
  searchButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  searchButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
  filterRow: {
    marginTop: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
  },
  filterChipActive: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  filterText: {
    fontFamily: typography.sans,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.charcoal,
  },
  filterTextActive: {
    color: colors.background,
  },
  productCardWrap: {
    flex: 1,
  },
  emptyCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    ...shadow.card,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textAlign: "center",
  },
  footerLoading: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  loadMoreButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  loadMoreText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
  footerSpacer: {
    height: spacing.xl,
  },
});
