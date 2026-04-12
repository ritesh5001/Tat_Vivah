import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { colors, radius, spacing, typography } from "../theme/tokens";
import { getCategories, type CategoryItem } from "../services/categories";
import {
  getProductsAndCache,
  getProductsCached,
  type ProductItem,
  type PaginationMeta,
} from "../services/products";
import { ProductGridCard } from "../components/ProductGridCard";

const LIMIT = 10;

export function MarketplaceScreen() {
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [pagination, setPagination] = React.useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);

  const loadCategories = React.useCallback(async () => {
    try {
      const response = await getCategories();
      setCategories(response.categories ?? []);
    } catch (error) {
      console.error("[marketplace] categories load failed", error);
      setCategories([]);
    }
  }, []);

  const loadProducts = React.useCallback(
    async (page: number, nextCategoryId?: string, nextSearch?: string) => {
      const params = {
        page,
        limit: LIMIT,
        categoryId: nextCategoryId,
        search: nextSearch,
      };
      setLoading(true);
      const cached = await getProductsCached(params);
      const hadCache = Boolean(cached?.data?.length);
      if (cached && hadCache) {
        setProducts(cached.data ?? []);
        setPagination(
          cached.pagination ?? {
            page,
            limit: LIMIT,
            total: 0,
            totalPages: 1,
          }
        );
        setLoading(false);
      }
      try {
        const response = await getProductsAndCache(params);
        setProducts(response.data ?? []);
        setPagination(
          response.pagination ?? {
            page,
            limit: LIMIT,
            total: 0,
            totalPages: 1,
          }
        );
      } catch (error) {
        console.error("[marketplace] products load failed", error);
        if (!hadCache) {
          setProducts([]);
        }
      } finally {
        if (!hadCache) {
          setLoading(false);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  React.useEffect(() => {
    loadProducts(pagination.page, categoryId, search);
  }, [loadProducts, pagination.page, categoryId, search]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearch(searchInput.trim());
  };

  const handleCategorySelect = (nextCategoryId?: string) => {
    setCategoryId(nextCategoryId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (nextPage: number) => {
    setPagination((prev) => ({ ...prev, page: nextPage }));
  };

  const renderItem = React.useCallback(
    ({ item }: { item: ProductItem }) => <ProductGridCard product={item} />,
    []
  );

  return (
    <FlatList
      data={products}
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Pressable
              style={[
                styles.filterChip,
                !categoryId && styles.filterChipActive,
              ]}
              onPress={() => handleCategorySelect(undefined)}
            >
              <Text
                style={[
                  styles.filterText,
                  !categoryId && styles.filterTextActive,
                ]}
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
      }
      ListEmptyComponent={
        loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Loading marketplace...</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No products found. Try adjusting your search or filters.
            </Text>
          </View>
        )
      }
      renderItem={renderItem}
      ListFooterComponent={
        <View style={styles.paginationRow}>
          <Pressable
            style={[styles.pageButton, pagination.page <= 1 && styles.pageButtonDisabled]}
            onPress={() => handlePageChange(Math.max(pagination.page - 1, 1))}
            disabled={pagination.page <= 1}
          >
            <Text style={styles.pageButtonText}>Previous</Text>
          </Pressable>
          <Text style={styles.pageIndicator}>
            Page {pagination.page} of {pagination.totalPages}
          </Text>
          <Pressable
            style={[
              styles.pageButton,
              pagination.page >= pagination.totalPages && styles.pageButtonDisabled,
            ]}
            onPress={() => handlePageChange(Math.min(pagination.page + 1, pagination.totalPages))}
            disabled={pagination.page >= pagination.totalPages}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
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
    lineHeight: 19,
    color: colors.brownSoft,
  },
  searchCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
    gap: spacing.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: typography.sans,
    color: colors.charcoal,
  },
  searchButton: {
    backgroundColor: colors.charcoal,
    paddingVertical: 10,
    borderRadius: 0,
    alignItems: "center",
  },
  searchButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.background,
  },
  filterRow: {
    marginTop: spacing.md,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    marginRight: spacing.sm,
    backgroundColor: colors.warmWhite,
  },
  filterChipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.cream,
  },
  filterText: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.brownSoft,
  },
  filterTextActive: {
    color: colors.charcoal,
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
    textAlign: "center",
  },
  paginationRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  pageButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    backgroundColor: colors.warmWhite,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.charcoal,
  },
  pageIndicator: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
  },
});
