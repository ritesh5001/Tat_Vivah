import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { getCategories } from "../../../src/services/catalog";
import { getProducts, type ProductSummary } from "../../../src/services/products";
import { isAbortError } from "../../../src/services/api";
import { SkeletonProductCard } from "../../../src/components/Skeleton";

const { width } = Dimensions.get("window");
const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;
const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

const DEBOUNCE_MS = 400;

// ---------------------------------------------------------------------------
// Memoized product card (avoids re-render when list scrolls)
// ---------------------------------------------------------------------------
const ProductCard = React.memo(function ProductCard({
  item,
  onPress,
}: {
  item: ProductSummary;
  onPress: (id: string) => void;
}) {
  const image = item.images?.[0] ?? fallbackImage;
  return (
    <Pressable style={styles.productCard} onPress={() => onPress(item.id)}>
      <Image
        source={{ uri: image }}
        style={styles.productImage}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <Text style={styles.productTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.productMeta}>
        {item.category?.name ?? "Collection"}
      </Text>
    </Pressable>
  );
});

export default function SearchScreen() {
  const router = useRouter();
  const [categories, setCategories] = React.useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedCategory, setSelectedCategory] = React.useState<
    string | undefined
  >(undefined);
  const [search, setSearch] = React.useState("");
  const [products, setProducts] = React.useState<ProductSummary[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  // Abort controller for the active search request
  const controllerRef = React.useRef<AbortController | null>(null);
  // Debounce timer
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const skeletons = React.useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        id: `skeleton-${index}`,
        skeleton: true as const,
      })),
    []
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const result = await getCategories();
        if (!controller.signal.aborted) {
          setCategories(result.categories ?? []);
        }
      } catch (err) {
        if (!isAbortError(err)) setCategories([]);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const loadProducts = React.useCallback(
    async (
      nextPage: number,
      replace: boolean,
      overrideSearch?: string,
      signal?: AbortSignal
    ) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await getProducts({
          page: nextPage,
          limit: 10,
          categoryId: selectedCategory,
          search: overrideSearch ?? (search.trim() || undefined),
        });
        if (signal?.aborted) return;
        const nextItems = response.data ?? [];
        setProducts((prev) => (replace ? nextItems : [...prev, ...nextItems]));
        setPage(response.pagination?.page ?? nextPage);
        setTotalPages(response.pagination?.totalPages ?? 1);
      } catch (err) {
        if (isAbortError(err)) return;
        if (replace) setProducts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, search]
  );

  // Load on category change
  React.useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    loadProducts(1, true, undefined, controller.signal);
    return () => controller.abort();
  }, [selectedCategory]);

  // Debounced search as user types
  const handleSearchChange = React.useCallback(
    (text: string) => {
      setSearch(text);

      // Cancel pending debounce + in-flight request
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controllerRef.current?.abort();

      debounceRef.current = setTimeout(() => {
        const controller = new AbortController();
        controllerRef.current = controller;
        loadProducts(1, true, text.trim() || undefined, controller.signal);
      }, DEBOUNCE_MS);
    },
    [loadProducts]
  );

  const handleSelectCategory = React.useCallback((id?: string) => {
    setSelectedCategory(id);
  }, []);

  const handleSearch = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    loadProducts(1, true, search.trim(), controller.signal);
  }, [loadProducts, search]);

  const handleLoadMore = React.useCallback(() => {
    if (!loadingMore && page < totalPages) {
      loadProducts(page + 1, false);
    }
  }, [loadingMore, page, totalPages, loadProducts]);

  const handleProductPress = React.useCallback(
    (id: string) => {
      router.push({ pathname: "/product/[id]", params: { id } });
    },
    [router]
  );

  // Stable renderItem — no inline closures
  const renderItem = React.useCallback(
    ({
      item,
    }: {
      item: ProductSummary | { id: string; skeleton: true };
    }) => {
      if ("skeleton" in item) {
        return <SkeletonProductCard width={cardWidth} />;
      }
      return <ProductCard item={item} onPress={handleProductPress} />;
    },
    [handleProductPress]
  );

  const keyExtractor = React.useCallback(
    (item: ProductSummary | { id: string; skeleton: true }) => item.id,
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <Text style={styles.headerCopy}>
          Discover verified sellers and curated collections.
        </Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search collections, styles..."
          placeholderTextColor={colors.brownSoft}
          value={search}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
        />
        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoryRow}
        renderItem={({ item }) => {
          const active = selectedCategory === item.id;
          return (
            <Pressable
              onPress={() =>
                handleSelectCategory(active ? undefined : item.id)
              }
              style={[
                styles.categoryChip,
                active && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  active && styles.categoryChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={
          (loading ? skeletons : products) as Array<
            ProductSummary | { id: string; skeleton: true }
          >
        }
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={renderItem}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products found.</Text>
            </View>
          ) : null
        }
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: colors.charcoal,
  },
  headerCopy: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  searchRow: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.warmWhite,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: typography.sans,
    color: colors.charcoal,
  },
  searchButton: {
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  searchButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.background,
  },
  categoryRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.warmWhite,
  },
  categoryChipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.cream,
  },
  categoryChipText: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brown,
  },
  categoryChipTextActive: {
    color: colors.charcoal,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  gridRow: {
    gap: spacing.md,
  },
  productCard: {
    width: cardWidth,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  productImage: {
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
  },
  productTitle: {
    marginTop: spacing.sm,
    fontFamily: typography.serif,
    fontSize: 14,
    color: colors.charcoal,
  },
  productMeta: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cream,
    marginTop: spacing.sm,
  },
  skeletonLineShort: {
    height: 12,
    width: "60%",
    borderRadius: 6,
    backgroundColor: colors.cream,
    marginTop: spacing.xs,
  },
  emptyState: {
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
});
