import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { getBestsellers, BestsellerProduct } from "../../../src/services/bestsellers";
import { getCategories, type Category } from "../../../src/services/catalog";
import { getProducts, type ProductItem, type ProductSummary } from "../../../src/services/products";
import { getRecentlyViewed, type RecentlyViewedProduct } from "../../../src/services/personalization";
import { getRecommendations, type RecommendationProduct } from "../../../src/services/recommendation";
import { isAbortError } from "../../../src/services/api";
import { ProductGridCard } from "../../../src/components/ProductGridCard";

const { width } = Dimensions.get("window");
const cardWidth = width - spacing.lg * 2;

const fallbackCategories = [
  "Sherwanis",
  "Kurtas",
  "Wedding Wear",
  "Accessories",
  "Gifting",
];

const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

const fallbackArrivals = [
  {
    id: "4",
    title: "Handloom Kurta",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "5",
    title: "Classic Bandhgala",
    image:
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [bestsellers, setBestsellers] = React.useState<BestsellerProduct[]>([]);
  const [loadingBestsellers, setLoadingBestsellers] = React.useState(true);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [arrivals, setArrivals] = React.useState<ProductSummary[]>([]);
  const [recentlyViewed, setRecentlyViewed] = React.useState<RecentlyViewedProduct[]>([]);
  const [recommendedProducts, setRecommendedProducts] = React.useState<ProductItem[]>([]);

  React.useEffect(() => {
    const recommendationsController = new AbortController();
    let cancelled = false;

    const load = async () => {
      try {
        const response = await getBestsellers(4);
        if (!cancelled) {
          setBestsellers(response.products ?? []);
        }
      } catch (err) {
        if (!cancelled && !isAbortError(err)) {
          setBestsellers([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingBestsellers(false);
        }
      }
    };

    const loadCategories = async () => {
      try {
        const response = await getCategories();
        if (!cancelled) {
          setCategories(response.categories ?? []);
        }
      } catch (err) {
        if (!cancelled && !isAbortError(err)) {
          setCategories([]);
        }
      }
    };

    const loadArrivals = async () => {
      try {
        const response = await getProducts({ page: 1, limit: 5 });
        if (!cancelled) {
          setArrivals(response.data ?? []);
        }
      } catch (err) {
        if (!cancelled && !isAbortError(err)) {
          setArrivals([]);
        }
      }
    };

    const loadRecentlyViewed = async () => {
      try {
        const products = await getRecentlyViewed();
        if (!cancelled) setRecentlyViewed(products);
      } catch {
        // Not logged in or no data — silently ignore
      }
    };

    const loadRecommendations = async () => {
      try {
        const products = await getRecommendations(recommendationsController.signal);
        if (cancelled) return;
        const normalized = products.map((product: RecommendationProduct) => ({
          id: product.id,
          title: product.title,
          images: product.images,
          category: product.category,
          price: product.adminListingPrice ?? product.sellerPrice,
          sellerPrice: product.sellerPrice,
          adminPrice: product.adminListingPrice,
        }));
        setRecommendedProducts(normalized);
      } catch (err) {
        if (!cancelled && !isAbortError(err)) {
          setRecommendedProducts([]);
        }
      }
    };

    load();
    loadCategories();
    loadArrivals();
    loadRecentlyViewed();
    loadRecommendations();

    return () => {
      cancelled = true;
      recommendationsController.abort();
    };
  }, []);

  const formatPrice = React.useCallback((price?: number | null) => {
    if (!price && price !== 0) return "Contact for price";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const handleProductPress = React.useCallback(
    (productId: string) => {
      router.push({ pathname: "/product/[id]", params: { id: productId } });
    },
    [router]
  );

  const renderProduct = React.useCallback(
    ({ item }: { item: BestsellerProduct }) => {
      const imageUri = item.image ?? fallbackImage;
      return (
        <Pressable
          style={styles.productCard}
          onPress={() => handleProductPress(item.productId)}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text style={styles.productPrice}>{formatPrice(item.minPrice)}</Text>
        </Pressable>
      );
    },
    [handleProductPress, formatPrice]
  );

  const renderRecommendationItem = React.useCallback(
    ({ item }: { item: ProductItem }) => (
      <View style={styles.recommendationCardWrap}>
        <ProductGridCard
          product={item}
          onExplore={() => handleProductPress(item.id)}
          onBuyNow={() => handleProductPress(item.id)}
        />
      </View>
    ),
    [handleProductPress],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={loadingBestsellers ? Array.from({ length: 3 }) : bestsellers}
        keyExtractor={(item, index) =>
          typeof item === "object" && item !== null
            ? (item as BestsellerProduct).id
            : `skeleton-${index}`
        }
        renderItem={({ item }) =>
          typeof item === "object" && item !== null ? (
            renderProduct({ item: item as BestsellerProduct })
          ) : (
            <View style={styles.productCard}>
              <View style={styles.productImage} />
              <View style={styles.skeletonLine} />
              <View style={styles.skeletonLineShort} />
            </View>
          )
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoLetter}>T</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.brand}>TatVivah</Text>
                <Text style={styles.brandTag}>Premium Indian Fashion</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  style={styles.headerActionButton}
                  onPress={() => router.push("/search")}
                >
                  <Text style={styles.headerActionText}>Search</Text>
                </Pressable>
                <Pressable
                  style={styles.headerActionButton}
                  onPress={() => router.push("/cart")}
                >
                  <Text style={styles.headerActionText}>Cart</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroGlowOne} />
              <View style={styles.heroGlowTwo} />
              <Text style={styles.heroEyebrow}>Curated mens fashion</Text>
              <Text style={styles.heroTitle}>The art of timeless elegance</Text>
              <Text style={styles.heroSubtitle}>
                Discover premium ethnic wear, crafted by verified artisans.
              </Text>
              <View style={styles.heroActions}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => router.push("/search")}
                >
                  <Text style={styles.primaryButtonText}>Explore collection</Text>
                </Pressable>
                <Pressable style={styles.ghostButton}>
                  <Text style={styles.ghostButtonText}>Partner with us</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.searchBlock}>
              <Text style={styles.sectionTitle}>Find your look</Text>
              <TextInput
                placeholder="Search sherwani, kurta, accessories"
                placeholderTextColor={colors.brownSoft}
                style={styles.searchInput}
                onFocus={() => router.push("/search")}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Shop by category</Text>
              <Text style={styles.sectionTitle}>Curated collections</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
            >
              {(categories.length ? categories.map((item) => item.name) : fallbackCategories).map(
                (item) => (
                  <View key={item} style={styles.chip}>
                    <Text style={styles.chipText}>{item}</Text>
                  </View>
                )
              )}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Bestsellers</Text>
              <Text style={styles.sectionTitle}>Crafted favorites</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View>
            {recommendedProducts.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionEyebrow}>Personalized picks</Text>
                  <Text style={styles.sectionTitle}>Recommended For You</Text>
                </View>
                <FlatList
                  horizontal
                  data={recommendedProducts}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  renderItem={renderRecommendationItem}
                  removeClippedSubviews
                  initialNumToRender={2}
                  maxToRenderPerBatch={2}
                  windowSize={5}
                  contentContainerStyle={styles.recommendationListContent}
                />
              </>
            )}

            {recentlyViewed.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionEyebrow}>Continue exploring</Text>
                  <Text style={styles.sectionTitle}>Recently viewed</Text>
                </View>
                <FlatList
                  horizontal
                  data={recentlyViewed}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.lg }}
                  renderItem={({ item }) => {
                    const image = item.images?.[0] ?? fallbackImage;
                    return (
                      <Pressable
                        style={styles.arrivalCard}
                        onPress={() =>
                          router.push({
                            pathname: "/product/[id]",
                            params: { id: item.id },
                          })
                        }
                      >
                        <Image
                          source={{ uri: image }}
                          style={styles.arrivalImage}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                        />
                        <Text style={styles.arrivalTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={styles.arrivalPrice}>
                          {item.adminListingPrice
                            ? formatPrice(item.adminListingPrice)
                            : formatPrice(item.sellerPrice)}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </>
            )}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>New arrivals</Text>
              <Text style={styles.sectionTitle}>Freshly tailored</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(arrivals.length ? arrivals : fallbackArrivals).map((item) => {
                const image = "image" in item ? item.image : item.images?.[0];
                const canNavigate = "images" in item;
                const price = "price" in item ? String(item.price) : undefined;
                return (
                  <Pressable
                    key={item.id}
                    style={styles.arrivalCard}
                    onPress={() =>
                      canNavigate
                        ? router.push({
                            pathname: "/product/[id]",
                            params: { id: item.id },
                          })
                        : undefined
                    }
                  >
                    <Image
                      source={{ uri: image ?? fallbackImage }}
                      style={styles.arrivalImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                    <Text style={styles.arrivalTitle}>{item.title}</Text>
                    {price ? <Text style={styles.arrivalPrice}>{price}</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.footerCard}>
              <Text style={styles.footerTitle}>Crafted with care</Text>
              <Text style={styles.footerCopy}>
                Verified artisans, secure checkout, and pan-India delivery.
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
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
  listContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  logoBadge: {
    height: 44,
    width: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
  },
  headerText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  brand: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  brandTag: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.brownSoft,
    textTransform: "uppercase",
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerActionButton: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.warmWhite,
  },
  headerActionText: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.charcoal,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    ...shadow.card,
  },
  heroGlowOne: {
    position: "absolute",
    top: -60,
    left: -40,
    height: 140,
    width: 140,
    borderRadius: 100,
    backgroundColor: colors.gold,
    opacity: 0.08,
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -80,
    right: -30,
    height: 160,
    width: 160,
    borderRadius: 100,
    backgroundColor: colors.goldMuted,
    opacity: 0.08,
  },
  heroEyebrow: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  heroTitle: {
    marginTop: spacing.sm,
    fontFamily: typography.serif,
    fontSize: 30,
    color: colors.charcoal,
    lineHeight: 36,
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.brownSoft,
  },
  heroActions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.charcoal,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.background,
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  ghostButtonText: {
    color: colors.charcoal,
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  searchBlock: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    marginTop: spacing.sm,
    backgroundColor: colors.warmWhite,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: typography.sans,
    color: colors.charcoal,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionEyebrow: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  sectionTitle: {
    marginTop: spacing.xs,
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.charcoal,
  },
  chipRow: {
    marginTop: spacing.md,
    paddingLeft: spacing.lg,
  },
  chip: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
  },
  chipText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brown,
  },
  productCard: {
    width: cardWidth,
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  productImage: {
    height: 180,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
  },
  productTitle: {
    marginTop: spacing.sm,
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  productPrice: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
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
  arrivalCard: {
    width: 200,
    marginTop: spacing.md,
    marginLeft: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  arrivalImage: {
    height: 140,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
  },
  arrivalTitle: {
    marginTop: spacing.sm,
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  arrivalPrice: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  recommendationListContent: {
    paddingHorizontal: spacing.lg,
  },
  recommendationCardWrap: {
    width: 260,
    marginRight: spacing.md,
    marginTop: spacing.md,
  },
  footerCard: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  footerTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  footerCopy: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
});
