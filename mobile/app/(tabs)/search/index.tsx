import * as React from "react";
import {
  InteractionManager,
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  Modal,
} from "react-native";
import { Image } from "../../../src/components/CompatImage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { getCategories } from "../../../src/services/catalog";
import {
  getProductsAndCache,
  getProductsCached,
  type ProductSummary,
} from "../../../src/services/products";
import { isAbortError } from "../../../src/services/api";
import { SkeletonProductCard } from "../../../src/components/Skeleton";
import { getSuggestions, type SuggestionItem, type SortOption } from "../../../src/services/search";
import { AppHeader } from "../../../src/components/AppHeader";
import { TatvivahLoader } from "../../../src/components/TatvivahLoader";
import {
  AppInput as TextInput,
  AppText as Text,
  ScreenContainer as SafeAreaView,
} from "../../../src/components";

const { width } = Dimensions.get("window");
const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;
const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

const DEBOUNCE_MS = 220;
const SUGGEST_DEBOUNCE_MS = 160;

const SORT_OPTIONS: { value: SortOption | ""; label: string }[] = [
  { value: "", label: "Default" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest First" },
  { value: "popularity", label: "Most Popular" },
];

type CategoryChipItem = {
  id: string;
  name: string;
};

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

const CategoryChip = React.memo(function CategoryChip({
  item,
  active,
  onPress,
}: {
  item: CategoryChipItem;
  active: boolean;
  onPress: (item: CategoryChipItem, active: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(item, active)}
      style={[styles.categoryChip, active && styles.categoryChipActive]}
    >
      <Text
        style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
      >
        {item.name}
      </Text>
    </Pressable>
  );
});

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; categoryId?: string }>();
  const initialSearch = typeof params.q === "string" ? params.q : "";
  const initialCategoryId =
    typeof params.categoryId === "string" ? params.categoryId : undefined;

  const [categories, setCategories] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = React.useState<
    string | undefined
  >(initialCategoryId);
  const [search, setSearch] = React.useState(initialSearch);
  const [products, setProducts] = React.useState<ProductSummary[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<SortOption | "">("");
  const [showSortSheet, setShowSortSheet] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Abort controller for the active search request
  const controllerRef = React.useRef<AbortController | null>(null);
  // Debounce timer
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Suggestion debounce timer
  const suggestDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Suggestion abort controller
  const suggestControllerRef = React.useRef<AbortController | null>(null);

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
      suggestControllerRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
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
        setFetchError(null);
      } else {
        setLoadingMore(true);
      }

      const cacheParams = {
        page: nextPage,
        limit: 10,
        categoryId: selectedCategory,
        search: overrideSearch ?? (search.trim() || undefined),
        sort: sortBy || undefined,
      };

      const cached = await getProductsCached(cacheParams);
      const hadCache = Boolean(cached?.data?.length);
      if (cached && replace && hadCache) {
        setProducts(cached.data ?? []);
        setPage(cached.pagination?.page ?? nextPage);
        setTotalPages(cached.pagination?.totalPages ?? 1);
        setLoading(false);
      }

      try {
        const response = await getProductsAndCache({
          ...cacheParams,
          page: nextPage,
        });
        if (signal?.aborted) return;
        const nextItems = response.data ?? [];
        setProducts((prev) => (replace ? nextItems : [...prev, ...nextItems]));
        setPage(response.pagination?.page ?? nextPage);
        setTotalPages(response.pagination?.totalPages ?? 1);
      } catch (err) {
        if (isAbortError(err)) return;
        const message =
          err instanceof Error ? err.message : "Failed to load products";
        setFetchError(message);
        if (replace && !hadCache) setProducts([]);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [selectedCategory, search, sortBy]
  );

  // Load on category or sort change
  React.useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    loadProducts(1, true, undefined, controller.signal);
    return () => controller.abort();
  }, [selectedCategory, sortBy, loadProducts]);

  // Debounced search as user types
  const handleSearchChange = React.useCallback(
    (text: string) => {
      setSearch(text);

      // Cancel pending debounce + in-flight request
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controllerRef.current?.abort();

      debounceRef.current = setTimeout(() => {
        const trimmed = text.trim();
        router.setParams({
          q: trimmed || undefined,
          categoryId: selectedCategory,
        });
        const controller = new AbortController();
        controllerRef.current = controller;
        loadProducts(1, true, trimmed || undefined, controller.signal);
        setShowSuggestions(false);
      }, DEBOUNCE_MS);

      // Fetch autocomplete suggestions
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
      suggestControllerRef.current?.abort();

      if (text.trim().length >= 2) {
        suggestDebounceRef.current = setTimeout(async () => {
          const ctrl = new AbortController();
          suggestControllerRef.current = ctrl;
          try {
            const items = await getSuggestions(text.trim(), 6, ctrl.signal);
            if (!ctrl.signal.aborted) {
              setSuggestions(items);
              setShowSuggestions(items.length > 0);
            }
          } catch (err) {
            if (!isAbortError(err)) {
              setSuggestions([]);
              setShowSuggestions(false);
            }
          }
        }, SUGGEST_DEBOUNCE_MS);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [loadProducts, router, selectedCategory]
  );

  const handleSelectCategory = React.useCallback((id?: string) => {
    setSelectedCategory(id);
    router.setParams({
      q: search.trim() || undefined,
      categoryId: id,
    });
  }, [router, search]);

  const handleSearch = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    controllerRef.current?.abort();
    const trimmed = search.trim();
    router.setParams({
      q: trimmed || undefined,
      categoryId: selectedCategory,
    });
    const controller = new AbortController();
    controllerRef.current = controller;
    loadProducts(1, true, trimmed, controller.signal);
  }, [loadProducts, router, search, selectedCategory]);

  const handleRetry = React.useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    loadProducts(1, true, search.trim() || undefined, controller.signal);
  }, [loadProducts, search]);

  const handleLoadMore = React.useCallback(() => {
    if (!loadingMore && page < totalPages) {
      loadProducts(page + 1, false);
    }
  }, [loadingMore, page, totalPages, loadProducts]);

  const handleProductPress = React.useCallback(
    (id: string) => {
      InteractionManager.runAfterInteractions(() => {
        router.push({ pathname: "/product/[id]", params: { id } });
      });
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

  const categoryKeyExtractor = React.useCallback((item: CategoryChipItem) => item.id, []);

  const categoryChips = React.useMemo<CategoryChipItem[]>(
    () => [{ id: "all", name: "All" }, ...categories],
    [categories]
  );

  const renderCategoryItem = React.useCallback(
    ({ item }: { item: CategoryChipItem }) => (
      <CategoryChip
        item={item}
        active={item.id === "all" ? !selectedCategory : selectedCategory === item.id}
        onPress={(pressedItem, active) =>
          handleSelectCategory(
            pressedItem.id === "all" ? undefined : active ? undefined : pressedItem.id
          )
        }
      />
    ),
    [handleSelectCategory, selectedCategory]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader variant="main" />

      <View style={styles.headerBlock}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Premium curated catalog</Text>
        <Text style={styles.subtitleCopy}>
          Discover wedding-ready edits crafted with heritage silhouettes and modern luxury detailing.
        </Text>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search collections, styles..."
            placeholderTextColor={colors.brownSoft}
            value={search}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => {
              setShowSuggestions(false);
              handleSearch();
            }}
            style={styles.searchInput}
          />
          <Pressable style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>
      </View>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item) => (
            <Pressable
              key={item.id}
              style={styles.suggestionItem}
              onPress={() => {
                setSearch(item.title);
                setShowSuggestions(false);
                setSuggestions([]);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                controllerRef.current?.abort();
                const controller = new AbortController();
                controllerRef.current = controller;
                router.setParams({ q: item.title, categoryId: selectedCategory });
                loadProducts(1, true, item.title, controller.signal);
              }}
            >
              <Text style={styles.suggestionTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.category ? (
                <Text style={styles.suggestionCategory}>{item.category}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}

      {/* Sort + Category Row */}
      <View style={styles.sortCategoryWrap}>
        <View style={styles.sortRow}>
          <Pressable
            style={styles.sortButtonWide}
            onPress={() => setShowSortSheet(true)}
          >
            <Text style={styles.sortButtonText}>Sort</Text>
          </Pressable>
          <Pressable style={styles.sortButtonWide} onPress={() => setShowSortSheet(true)}>
            <Text style={styles.sortButtonText}>Filter</Text>
          </Pressable>
        </View>

        <FlatList
          data={categoryChips}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={categoryKeyExtractor}
          contentContainerStyle={styles.categoryRow}
          renderItem={renderCategoryItem}
        />
      </View>

      {/* Sort bottom sheet */}
      <Modal
        visible={showSortSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortSheet(false)}
      >
        <Pressable
          style={styles.sortOverlay}
          onPress={() => setShowSortSheet(false)}
        >
          <View style={styles.sortSheet}>
            <Text style={styles.sortSheetTitle}>Sort By</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.sortSheetOption,
                  sortBy === opt.value && styles.sortSheetOptionActive,
                ]}
                onPress={() => {
                  setSortBy(opt.value as SortOption | "");
                  setShowSortSheet(false);
                }}
              >
                <Text
                  style={[
                    styles.sortSheetOptionText,
                    sortBy === opt.value && styles.sortSheetOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {fetchError && !loading && products.length === 0 ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Unable to load products</Text>
          <Text style={styles.errorMessage}>{fetchError}</Text>
          <Pressable style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={
          (loading ? skeletons : products) as (
            ProductSummary | { id: string; skeleton: true }
          )[]
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
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreWrap}>
              <TatvivahLoader size="sm" color={colors.gold} />
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
  headerBlock: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
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
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceElevated,
    ...shadow.card,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: typography.sans,
    color: colors.charcoal,
  },
  searchButton: {
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 0,
    paddingHorizontal: spacing.lg,
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 0,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(184, 149, 108, 0.14)",
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
    padding: spacing.md,
    borderRadius: 0,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  productImage: {
    height: 160,
    borderRadius: 0,
    backgroundColor: colors.surface,
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
    borderRadius: 0,
    backgroundColor: colors.cream,
    marginTop: spacing.sm,
  },
  skeletonLineShort: {
    height: 12,
    width: "60%",
    borderRadius: 0,
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
  errorCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    ...shadow.card,
  },
  errorTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  errorMessage: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.background,
  },
  loadingMoreWrap: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  suggestionsContainer: {
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    backgroundColor: colors.surfaceElevated,
    ...shadow.card,
    maxHeight: 220,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  suggestionTitle: {
    flex: 1,
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.charcoal,
  },
  suggestionCategory: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: spacing.sm,
  },
  sortCategoryWrap: {
    marginTop: spacing.md,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sortButtonWide: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 0,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.gold,
  },
  sortButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.background,
  },
  sortOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sortSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sortSheetTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
    marginBottom: spacing.md,
  },
  sortSheetOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  sortSheetOptionActive: {
    backgroundColor: "rgba(184, 149, 108, 0.14)",
    borderRadius: 0,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sortSheetOptionText: {
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.brown,
  },
  sortSheetOptionTextActive: {
    color: colors.charcoal,
    fontFamily: typography.sansMedium,
  },
});
