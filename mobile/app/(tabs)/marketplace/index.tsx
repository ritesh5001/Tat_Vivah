import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { AppHeader } from "../../../src/components/AppHeader";
import { getCategories, type Category } from "../../../src/services/catalog";
import {
  getProducts,
  type ProductItem,
} from "../../../src/services/products";
import { ProductGridCard } from "../../../src/components/ProductGridCard";
import { ApiError } from "../../../src/services/api";
import { TatvivahLoader } from "../../../src/components/TatvivahLoader";

const LIMIT = 12;

export default function MarketplaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; q?: string }>();
  const initialCategoryId =
    typeof params.categoryId === "string" ? params.categoryId : undefined;
  const initialSearch = typeof params.q === "string" ? params.q : "";

  const [categoryId, setCategoryId] = React.useState<string | undefined>(initialCategoryId);
  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [search, setSearch] = React.useState(initialSearch);
  const { data: categoryData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const categories = React.useMemo<Category[]>(
    () => categoryData?.categories ?? [],
    [categoryData]
  );

  const productsQuery = useInfiniteQuery({
    queryKey: ["products", { categoryId, search }],
    queryFn: ({ pageParam = 1, signal }) =>
      getProducts({
        page: pageParam,
        limit: LIMIT,
        categoryId,
        search: search.trim() || undefined,
        signal,
      }),
    getNextPageParam: (lastPage) => {
      const current = lastPage.pagination?.page ?? 1;
      const total = lastPage.pagination?.totalPages ?? 1;
      return current < total ? current + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const products = React.useMemo<ProductItem[]>(
    () => productsQuery.data?.pages.flatMap((page) => page.data as ProductItem[]) ?? [],
    [productsQuery.data]
  );

  const handleSearch = React.useCallback(() => {
    setSearch(searchInput.trim());
  }, [searchInput]);

  const handleCategorySelect = React.useCallback((next?: string) => {
    setCategoryId(next);
  }, []);

  const handleLoadMore = React.useCallback(() => {
    if (productsQuery.isFetchingNextPage || !productsQuery.hasNextPage) return;
    productsQuery.fetchNextPage();
  }, [productsQuery]);

  const handleProductPress = React.useCallback(
    (product: ProductItem) => {
      router.push(`/product/${product.id}`);
    },
    [router]
  );

  const renderItem = React.useCallback(
    ({ item, index }: { item: ProductItem; index: number }) => (
      <View
        style={styles.productCardWrap}
      >
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
      <Text style={styles.title}>Marketplace</Text>
      <Text style={styles.subtitle}>Premium curated catalog</Text>

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

      <View style={styles.sortRow}>
        <Pressable style={styles.sortButton}>
          <Text style={styles.sortText}>Sort</Text>
        </Pressable>
        <Pressable style={styles.sortButton}>
          <Text style={styles.sortText}>Filter</Text>
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
      <FlashList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.container}
        
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          productsQuery.isLoading ? (
            <View style={styles.emptyCard}>
              <TatvivahLoader label="Loading marketplace" color={colors.gold} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {productsQuery.error instanceof ApiError
                  ? productsQuery.error.message
                  : productsQuery.error instanceof Error
                    ? productsQuery.error.message
                    : "No products found. Try adjusting your search."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          productsQuery.isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <TatvivahLoader size="sm" color={colors.gold} />
            </View>
          ) : productsQuery.hasNextPage ? (
            <Pressable style={styles.loadMoreButton} onPress={handleLoadMore}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        refreshing={productsQuery.isRefetching}
        onRefresh={() => productsQuery.refetch()}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  gridRow: {
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: colors.charcoal,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: typography.sans,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: colors.brownSoft,
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
  sortRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  sortButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
  },
  sortText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.charcoal,
  },
  filterRow: {
    marginTop: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
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
