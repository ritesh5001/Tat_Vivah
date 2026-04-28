import * as React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "../../../src/components/CompatImage";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, typography, shadow } from "../../../src/theme/tokens";
import { AppHeader } from "../../../src/components/AppHeader";
import { getCategories, type Category } from "../../../src/services/catalog";
import {
  getProducts,
  getProductById,
  type ProductItem,
} from "../../../src/services/products";
import { ApiError } from "../../../src/services/api";
import { TatvivahLoader } from "../../../src/components/TatvivahLoader";
import {
  AppInput as TextInput,
  AppText as Text,
  ScreenContainer as SafeAreaView,
} from "../../../src/components";

const LIMIT = 12;
const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

export default function MarketplaceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
    refetchOnMount: false,
  });

  const products = React.useMemo<ProductItem[]>(
    () => productsQuery.data?.pages.flatMap((page) => page.data as ProductItem[]) ?? [],
    [productsQuery.data]
  );

  const formatPrice = React.useCallback((price?: number | null) => {
    if (!price && price !== 0) return "Price on request";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

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
      void queryClient.prefetchQuery({
        queryKey: ["product", product.id],
        queryFn: ({ signal }) => getProductById(product.id, signal),
        staleTime: 10 * 60 * 1000,
      });
      router.push(`/product/${product.id}`);
    },
    [queryClient, router]
  );

  const renderItem = React.useCallback(
    ({ item }: { item: ProductItem; index: number }) => (
      <Pressable style={styles.marketplaceCard} onPress={() => handleProductPress(item)}>
        <Image
          source={item.images?.[0] ? { uri: item.images[0] } : { uri: fallbackImage }}
          style={styles.marketplaceImage}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
        />
        <View style={styles.marketplaceInfo}>
          <Text numberOfLines={1} style={styles.marketplaceTitle}>
            {item.title}
          </Text>
          <Text numberOfLines={1} style={styles.marketplaceCategory}>
            {item.category?.name ?? "Collection"}
          </Text>
          <View style={styles.marketplacePriceRow}>
            <Text style={styles.marketplacePrice}>
              {formatPrice(item.salePrice ?? item.adminPrice ?? item.price ?? item.sellerPrice)}
            </Text>
            {typeof item.regularPrice === "number" &&
            typeof (item.salePrice ?? item.adminPrice ?? item.price ?? item.sellerPrice) === "number" &&
            item.regularPrice > Number(item.salePrice ?? item.adminPrice ?? item.price ?? item.sellerPrice) ? (
              <Text style={styles.marketplacePriceStrike}>
                {formatPrice(item.regularPrice)}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    ),
    [formatPrice, handleProductPress]
  );

  const ListHeader = (
    <View style={styles.header}>
      <Text style={styles.title}>Marketplace</Text>
      <Text style={styles.subtitle}>Premium curated catalog</Text>
      <Text style={styles.subtitleCopy}>
        Discover wedding-ready edits crafted with heritage silhouettes and modern luxury detailing.
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
      <AppHeader variant="main" />
      <FlashList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        estimatedItemSize={330}
        contentContainerStyle={styles.container}
        drawDistance={420}
        renderItem={renderItem}
        removeClippedSubviews
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
    gap: spacing.lg,
  },
  gridRow: {
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
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
  subtitleCopy: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brownSoft,
  },
  searchCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceElevated,
    ...shadow.card,
  },
  searchInput: {
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.charcoal,
    borderWidth: 1,
    borderBottomColor: colors.borderSoft,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  searchButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 0,
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
    backgroundColor: colors.gold,
    paddingVertical: 10,
    borderRadius: 0,
    alignItems: "center",
  },
  sortText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.background,
  },
  filterRow: {
    marginTop: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceElevated,
  },
  filterChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
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
  marketplaceCard: {
    flex: 1,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceElevated,
    ...shadow.card,
    marginBottom: spacing.lg,
  },
  marketplaceImage: {
    width: "100%",
    aspectRatio: 0.75,
    backgroundColor: colors.surface,
  },
  marketplaceInfo: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  marketplaceTitle: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: colors.charcoal,
  },
  marketplaceCategory: {
    marginTop: 4,
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.brownSoft,
  },
  marketplacePriceRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  marketplacePrice: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.charcoal,
  },
  marketplacePriceStrike: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
    textDecorationLine: "line-through",
  },
  emptyCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 0,
    backgroundColor: colors.charcoal,
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
    backgroundColor: "rgba(184, 149, 108, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 0,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  loadMoreText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.charcoal,
  },
  footerSpacer: {
    height: spacing.xl,
  },
});
