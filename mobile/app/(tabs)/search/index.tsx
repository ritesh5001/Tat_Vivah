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

const { width } = Dimensions.get("window");
const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;
const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

export default function SearchScreen() {
  const router = useRouter();
  const [categories, setCategories] = React.useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(undefined);
  const [search, setSearch] = React.useState("");
  const [products, setProducts] = React.useState<ProductSummary[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const skeletons = React.useMemo(
    () => Array.from({ length: 6 }, (_, index) => ({ id: `skeleton-${index}`, skeleton: true as const })),
    []
  );

  React.useEffect(() => {
    const load = async () => {
      try {
        const result = await getCategories();
        setCategories(result.categories ?? []);
      } catch {
        setCategories([]);
      }
    };
    load();
  }, []);

  const loadProducts = async (
    nextPage: number,
    replace = false,
    overrideSearch?: string
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
      const nextItems = response.data ?? [];
      setProducts((prev) => (replace ? nextItems : [...prev, ...nextItems]));
      setPage(response.pagination?.page ?? nextPage);
      setTotalPages(response.pagination?.totalPages ?? 1);
    } catch {
      if (replace) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  React.useEffect(() => {
    loadProducts(1, true);
  }, [selectedCategory]);

  const handleSelectCategory = (id?: string) => {
    setSelectedCategory(id);
  };

  const handleSearch = () => {
    loadProducts(1, true, search.trim());
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      loadProducts(page + 1, false);
    }
  };

  const renderCard = ({ item }: { item: ProductSummary }) => {
    const image = item.images?.[0] ?? fallbackImage;
    return (
      <Pressable
        style={styles.productCard}
        onPress={() =>
          router.push({
            pathname: "/product/[id]",
            params: { id: item.id },
          })
        }
      >
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
        <Text style={styles.productMeta}>{item.category?.name ?? "Collection"}</Text>
      </Pressable>
    );
  };

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
          onChangeText={setSearch}
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
              onPress={() => handleSelectCategory(active ? undefined : item.id)}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              <Text
                style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={(loading ? skeletons : products) as Array<
          ProductSummary | { id: string; skeleton: true }
        >}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) =>
          "skeleton" in item ? (
            <View style={styles.productCard}>
              <View style={styles.productImage} />
              <View style={styles.skeletonLine} />
              <View style={styles.skeletonLineShort} />
            </View>
          ) : (
            renderCard({ item })
          )
        }
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
