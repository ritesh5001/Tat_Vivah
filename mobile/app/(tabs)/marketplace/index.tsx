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

export default function CategoriesScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | undefined>(
    typeof params.categoryId === "string" ? params.categoryId : undefined
  );

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

  // Fetch popular products for selected category or all
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
  });

  const popularProducts = React.useMemo<ProductItem[]>(
    () => (popularData?.data as ProductItem[]) ?? [],
    [popularData]
  );

  const sidebarWidth = Math.round(windowWidth * 0.22);
  const contentWidth = windowWidth - sidebarWidth;
  const cardWidth = Math.floor((contentWidth - spacing.md * 2 - spacing.md * (COLS - 1)) / COLS);

  const handleProductPress = React.useCallback(
    (product: ProductItem) => {
      router.push(`/product/${product.id}`);
    },
    [router]
  );

  const handleCategorySelect = React.useCallback((categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId);
  }, []);

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
            <Text style={styles.sectionTitle}>
              {selectedCategoryId ? "All Products" : "All Products"}
            </Text>
            {popularLoading ? (
              <View style={styles.loadingWrap}>
                <TatvivahLoader size="sm" color={colors.gold} />
              </View>
            ) : popularProducts.length === 0 ? (
              <Text style={styles.emptyText}>No products in this category</Text>
            ) : (
              <View style={styles.grid}>
                {popularProducts.map((product, idx) => (
                  <View key={`popular-${idx}`} style={{ width: cardWidth }}>
                    {renderProductCard({ item: product })}
                  </View>
                ))}
              </View>
            )}
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
    paddingTop: spacing.sm,
  },
  sidebarLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryItem: {
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  categoryItemActive: {
    borderLeftColor: colors.primaryAccent,
    backgroundColor: "rgba(184, 149, 108, 0.08)",
  },
  categoryImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  categoryImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryName: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.charcoal,
    textAlign: "center",
    marginTop: spacing.xs,
    flexShrink: 1,
    maxWidth: 66,
  },
  categoryNameActive: {
    fontFamily: typography.sansMedium,
    color: colors.primaryAccent,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.sansMedium,
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.charcoal,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
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
});
