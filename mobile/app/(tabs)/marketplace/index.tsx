import * as React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "../../../src/components/CompatImage";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../../src/theme/tokens";
import { AppHeader } from "../../../src/components/AppHeader";
import { getCategories, type Category } from "../../../src/services/catalog";
import {
  getProducts,
  type ProductItem,
} from "../../../src/services/products";
import { TatvivahLoader } from "../../../src/components/TatvivahLoader";
import { MarketplaceCard } from "../../../src/components/MarketplaceCard";
import {
  AppText as Text,
  ScreenContainer as SafeAreaView,
} from "../../../src/components";

const COLS = 2;
const FEATURED_LIMIT = 9;
const POPULAR_LIMIT = 12;
const ALL_PRODUCTS_PAGE_SIZE = 8;

function mergeUniqueProducts(current: ProductItem[], incoming: ProductItem[]): ProductItem[] {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map((product) => product.id));
  const merged = [...current];

  incoming.forEach((product) => {
    if (!seen.has(product.id)) {
      merged.push(product);
      seen.add(product.id);
    }
  });

  return merged;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | undefined>(
    typeof params.categoryId === "string" ? params.categoryId : undefined
  );
  const [allProducts, setAllProducts] = React.useState<ProductItem[]>([]);
  const [allVisibleCount, setAllVisibleCount] = React.useState(0);
  const [allNextPage, setAllNextPage] = React.useState(2);
  const [isAllPrefetching, setIsAllPrefetching] = React.useState(false);
  const [hasMoreAllProducts, setHasMoreAllProducts] = React.useState(true);
  const [hasAllProductsError, setHasAllProductsError] = React.useState(false);
  const [pendingAllReveal, setPendingAllReveal] = React.useState(false);

  const { data: categoryData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const categories = React.useMemo<Category[]>(
    () => categoryData?.categories ?? [],
    [categoryData]
  );

  // Fetch featured products (no category filter)
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["products", { limit: FEATURED_LIMIT, featured: true }],
    queryFn: ({ signal }) =>
      getProducts({
        page: 1,
        limit: FEATURED_LIMIT,
        signal,
      }),
    staleTime: 1000 * 60 * 5,
  });

  const featuredProducts = React.useMemo<ProductItem[]>(
    () => (featuredData?.data as ProductItem[]) ?? [],
    [featuredData]
  );

  // Fetch all-category products using the same popularity ordering as homepage.
  const { data: allProductsData, isLoading: allProductsLoading } = useQuery({
    queryKey: ["marketplace-all-products", { limit: ALL_PRODUCTS_PAGE_SIZE, sort: "popularity" }],
    queryFn: ({ signal }) =>
      getProducts({
        page: 1,
        limit: ALL_PRODUCTS_PAGE_SIZE,
        sort: "popularity",
        signal,
      }),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch popular products for selected category only
  const { data: popularData, isLoading: popularLoading } = useQuery({
    queryKey: ["products", { categoryId: selectedCategoryId, limit: POPULAR_LIMIT }],
    queryFn: ({ signal }) =>
      getProducts({
        page: 1,
        limit: POPULAR_LIMIT,
        categoryId: selectedCategoryId,
        signal,
      }),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(selectedCategoryId),
  });

  const popularProducts = React.useMemo<ProductItem[]>(
    () => (popularData?.data as ProductItem[]) ?? [],
    [popularData]
  );

  const sidebarWidth = Math.max(72, Math.round(windowWidth * 0.18));
  const contentWidth = windowWidth - sidebarWidth;
  const contentPad = 10;
  const cardGap = 10;
  const cardWidth = Math.floor((contentWidth - contentPad * 2 - cardGap * (COLS - 1)) / COLS);

  const selectedCategory = React.useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const visibleAllProducts = React.useMemo(
    () => allProducts.slice(0, allVisibleCount),
    [allProducts, allVisibleCount]
  );

  const prefetchNextAllProducts = React.useCallback(async () => {
    if (isAllPrefetching || !hasMoreAllProducts) return;

    setIsAllPrefetching(true);
    setHasAllProductsError(false);

    try {
      const response = await getProducts({
        page: allNextPage,
        limit: ALL_PRODUCTS_PAGE_SIZE,
        sort: "popularity",
      });
      const incoming = (response.data ?? []) as ProductItem[];
      const totalPages = response.pagination?.totalPages;

      setAllProducts((previous) => mergeUniqueProducts(previous, incoming));
      setAllNextPage((previous) => previous + 1);
      setHasMoreAllProducts(
        (typeof totalPages === "number"
          ? allNextPage < totalPages
          : incoming.length === ALL_PRODUCTS_PAGE_SIZE) && incoming.length > 0
      );
    } catch {
      setHasAllProductsError(true);
      setHasMoreAllProducts(false);
    } finally {
      setIsAllPrefetching(false);
    }
  }, [allNextPage, hasMoreAllProducts, isAllPrefetching]);

  const revealNextAllProducts = React.useCallback(() => {
    if (selectedCategoryId) return;

    if (allVisibleCount < allProducts.length) {
      setAllVisibleCount((previous) =>
        Math.min(previous + ALL_PRODUCTS_PAGE_SIZE, allProducts.length)
      );
      return;
    }

    if (hasMoreAllProducts) {
      setPendingAllReveal(true);
      void prefetchNextAllProducts();
    }
  }, [
    allProducts.length,
    allVisibleCount,
    hasMoreAllProducts,
    prefetchNextAllProducts,
    selectedCategoryId,
  ]);

  React.useEffect(() => {
    const products = ((allProductsData?.data ?? []) as ProductItem[]);
    if (!allProductsData) return;

    const totalPages = allProductsData.pagination?.totalPages;
    setAllProducts(mergeUniqueProducts([], products));
    setAllVisibleCount(Math.min(ALL_PRODUCTS_PAGE_SIZE, products.length));
    setAllNextPage(2);
    setHasMoreAllProducts(
      typeof totalPages === "number" ? totalPages > 1 : products.length === ALL_PRODUCTS_PAGE_SIZE
    );
    setHasAllProductsError(false);
    setPendingAllReveal(false);
  }, [allProductsData]);

  React.useEffect(() => {
    if (selectedCategoryId) return;
    if (allProductsLoading) return;
    if (!hasMoreAllProducts || isAllPrefetching) return;
    if (allProducts.length - allVisibleCount >= ALL_PRODUCTS_PAGE_SIZE) return;

    void prefetchNextAllProducts();
  }, [
    allProducts.length,
    allProductsLoading,
    allVisibleCount,
    hasMoreAllProducts,
    isAllPrefetching,
    prefetchNextAllProducts,
    selectedCategoryId,
  ]);

  React.useEffect(() => {
    if (!pendingAllReveal) return;

    if (allVisibleCount < allProducts.length) {
      setAllVisibleCount((previous) =>
        Math.min(previous + ALL_PRODUCTS_PAGE_SIZE, allProducts.length)
      );
      setPendingAllReveal(false);
      return;
    }

    if (!hasMoreAllProducts && !isAllPrefetching) {
      setPendingAllReveal(false);
    }
  }, [
    allProducts.length,
    allVisibleCount,
    hasMoreAllProducts,
    isAllPrefetching,
    pendingAllReveal,
  ]);

  const handleProductPress = React.useCallback(
    (product: ProductItem) => {
      router.push(`/product/${product.id}`);
    },
    [router]
  );

  const handleCategorySelect = React.useCallback((categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const handleContentScroll = React.useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      if (selectedCategoryId) return;
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (distanceFromBottom < 900) {
        revealNextAllProducts();
      }
    },
    [revealNextAllProducts, selectedCategoryId]
  );

  const renderCategoryItem = React.useCallback(
    ({ item }: { item: Category }) => {
      const isActive = selectedCategoryId === item.id;
      return (
        <Pressable
          style={[styles.categoryItem, isActive && styles.categoryItemActive]}
          onPress={() => handleCategorySelect(item.id)}
        >
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={styles.categoryImage}
              contentFit="cover"
            />
          )}
          <Text
            style={[styles.categoryName, isActive && styles.categoryNameActive]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </Pressable>
      );
    },
    [selectedCategoryId, handleCategorySelect]
  );

  const renderProductCard = React.useCallback(
    ({ item }: { item: ProductItem }) => (
      <MarketplaceCard
        product={item}
        onPress={() => handleProductPress(item)}
        style={{ width: cardWidth }}
      />
    ),
    [cardWidth, handleProductPress]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        variant="sub"
        title="CATEGORIES"
        showBack
        showSearch
        showWishlist
        showCart
      />

      <View style={styles.container}>
        {/* Left Sidebar - Categories */}
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
          {categoriesLoading ? (
            <View style={styles.sidebarLoading}>
              <TatvivahLoader size="sm" color={colors.gold} />
            </View>
          ) : (
            <>
              {/* All Categories option */}
              <Pressable
                style={[
                  styles.categoryItem,
                  !selectedCategoryId && styles.categoryItemActive,
                ]}
                onPress={() => handleCategorySelect(undefined)}
              >
                <View style={styles.categoryImagePlaceholder}>
                  <Ionicons name="grid" size={24} color={colors.charcoal} />
                </View>
                <Text
                  style={[
                    styles.categoryName,
                    !selectedCategoryId && styles.categoryNameActive,
                  ]}
                  numberOfLines={2}
                >
                  All Categories
                </Text>
              </Pressable>

              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={renderCategoryItem}
                scrollEnabled
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </View>

        {/* Right Content Area */}
        <ScrollView
          style={[styles.contentArea, { width: contentWidth }]}
          showsVerticalScrollIndicator={false}
          onScroll={handleContentScroll}
          scrollEventThrottle={16}
        >
          {/* Featured Section — only on All Categories */}
          {!selectedCategoryId ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured On TatVivah</Text>
              {featuredLoading ? (
                <View style={styles.loadingWrap}>
                  <TatvivahLoader size="sm" color={colors.gold} />
                </View>
              ) : featuredProducts.length === 0 ? (
                <Text style={styles.emptyText}>No featured products</Text>
              ) : (
                <View style={styles.grid}>
                  {featuredProducts.map((product, idx) => (
                    <View key={`featured-${idx}`} style={{ width: cardWidth }}>
                      {renderProductCard({ item: product })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {/* Popular Section */}
          <View style={styles.section}>
            {selectedCategory ? (
              <View style={styles.categoryHeader}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryHeaderMark} />
                  <Text style={styles.categoryHeaderEyebrow}>Shopping</Text>
                </View>
                <Text style={styles.categoryHeaderTitle}>{selectedCategory.name}</Text>
                <Text style={styles.categoryHeaderMeta}>
                  {popularLoading
                    ? "Loading…"
                    : `${popularProducts.length} ${popularProducts.length === 1 ? "piece" : "pieces"} curated for you`}
                </Text>
              </View>
            ) : (
              <Text style={styles.sectionTitle}>All Products</Text>
            )}
            {popularLoading ? (
              <View style={styles.loadingWrap}>
                <TatvivahLoader size="sm" color={colors.gold} />
              </View>
            ) : selectedCategoryId && popularProducts.length === 0 ? (
              <Text style={styles.emptyText}>No products in this category</Text>
            ) : !selectedCategoryId && allProductsLoading ? (
              <View style={styles.loadingWrap}>
                <TatvivahLoader size="sm" color={colors.gold} />
              </View>
            ) : !selectedCategoryId && visibleAllProducts.length === 0 ? (
              <Text style={styles.emptyText}>No products available right now</Text>
            ) : (
              <View style={styles.grid}>
                {(selectedCategoryId ? popularProducts : visibleAllProducts).map((product, idx) => (
                  <View key={`popular-${product.id}-${idx}`} style={{ width: cardWidth }}>
                    {renderProductCard({ item: product })}
                  </View>
                ))}
              </View>
            )}
            {!selectedCategoryId ? (
              hasAllProductsError ? (
                <Text style={styles.statusText}>Could not load more products right now.</Text>
              ) : isAllPrefetching ? (
                <Text style={styles.statusText}>Loading next products...</Text>
              ) : hasMoreAllProducts ? (
                <Text style={styles.statusText}>Scroll down to reveal more products</Text>
              ) : visibleAllProducts.length > 0 ? (
                <Text style={styles.statusText}>You have reached the end.</Text>
              ) : null
            ) : null}
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.background,
  },
  sidebar: {
    borderRightWidth: 1,
    borderRightColor: colors.borderSoft,
    backgroundColor: colors.background,
    paddingHorizontal: 0,
    paddingTop: 6,
  },
  sidebarLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryItem: {
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  categoryItemActive: {
    borderLeftColor: colors.gold,
    backgroundColor: colors.cream,
  },
  categoryImage: {
    width: 44,
    height: 58,
    borderRadius: 0,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  categoryImagePlaceholder: {
    width: 44,
    height: 58,
    borderRadius: 0,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryName: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.charcoal,
    textAlign: "center",
    marginTop: 5,
    flexShrink: 1,
    paddingHorizontal: 2,
  },
  categoryNameActive: {
    fontFamily: typography.sansMedium,
    color: colors.gold,
    fontWeight: "700",
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.charcoal,
    marginBottom: 12,
    fontWeight: "700",
  },
  categoryHeader: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  categoryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  categoryHeaderMark: {
    width: 18,
    height: 1.5,
    backgroundColor: colors.gold,
  },
  categoryHeaderEyebrow: {
    fontFamily: typography.sansMedium,
    fontSize: 9.5,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
    fontWeight: "700",
  },
  categoryHeaderTitle: {
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.charcoal,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  categoryHeaderMeta: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  loadingWrap: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  statusText: {
    marginTop: spacing.md,
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textAlign: "center",
    letterSpacing: 0.4,
  },
});
