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
import {
  getProducts,
  getProductsAndCache,
  getProductsCached,
  type ProductItem,
  type ProductSummary,
} from "../../../src/services/products";
import { getRecentlyViewed, type RecentlyViewedProduct } from "../../../src/services/personalization";
import { getRecommendations, type RecommendationProduct } from "../../../src/services/recommendation";
import { isAbortError } from "../../../src/services/api";
import { ProductGridCard } from "../../../src/components/ProductGridCard";
import { images } from "../../../src/data/images";
import { AppHeader } from "../../../src/components/AppHeader";

const { width } = Dimensions.get("window");
const cardWidth = width - spacing.lg * 2;

const fallbackCategories = [
  "Sherwanis",
  "Kurtas",
  "Wedding Wear",
  "Accessories",
  "Gifting",
];

const categoryCards = [
  {
    label: "Sherwani",
    image: images.categories.wedding,
    matches: ["sherwani", "wedding"],
  },
  {
    label: "Kurta",
    image: images.categories.kurta,
    matches: ["kurta"],
  },
  {
    label: "Indo-Western",
    image: images.categories.indoWestern,
    matches: ["indo", "western"],
  },
  {
    label: "Accessories",
    image: images.categories.accessories,
    matches: ["accessor"],
  },
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
  const [marketplaceProducts, setMarketplaceProducts] = React.useState<ProductItem[]>([]);
  const [loadingMarketplace, setLoadingMarketplace] = React.useState(true);

  React.useEffect(() => {
    const recommendationsController = new AbortController();
    let cancelled = false;

    const load = async () => {
      try {
        const response = await getBestsellers(8);
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

    const loadMarketplacePreview = async () => {
      const params = { page: 1, limit: 6 };
      try {
        const cached = await getProductsCached(params);
        if (cached?.data?.length && !cancelled) {
          setMarketplaceProducts(cached.data as ProductItem[]);
          setLoadingMarketplace(false);
        }
      } catch {
        // ignore cache errors
      }

      try {
        const response = await getProductsAndCache(params);
        if (!cancelled) {
          setMarketplaceProducts(response.data as ProductItem[]);
        }
      } catch (err) {
        if (!cancelled && !isAbortError(err)) {
          setMarketplaceProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingMarketplace(false);
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
    loadMarketplacePreview();

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

  const handleCategoryPress = React.useCallback(
    (matches: string[]) => {
      const found = categories.find((category) =>
        matches.some((match) =>
          category.name.toLowerCase().includes(match)
        )
      );
      router.push({
        pathname: "/marketplace",
        params: found?.id ? { categoryId: found.id } : {},
      });
    },
    [categories, router]
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

  const renderMarketplaceItem = React.useCallback(
    ({ item }: { item: ProductItem }) => (
      <View style={styles.marketplaceCardWrap}>
        <ProductGridCard
          product={item}
          onExplore={() => handleProductPress(item.id)}
          onBuyNow={() => handleProductPress(item.id)}
        />
      </View>
    ),
    [handleProductPress]
  );

  return (
    <>
      <AppHeader showSearch showCart showMenu showBack={false} />
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
              <Text style={styles.sectionTitle}>Visual edits</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
              {categoryCards.map((card) => (
                <Pressable
                  key={card.label}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(card.matches)}
                >
                  <Image
                    source={card.image}
                    style={styles.categoryImage}
                    contentFit="cover"
                  />
                  <View style={styles.categoryOverlay} />
                  <Text style={styles.categoryLabel}>{card.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

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
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionEyebrow}>Marketplace</Text>
                <Text style={styles.sectionTitle}>Explore the full catalog</Text>
              </View>
              <Pressable
                style={styles.sectionAction}
                onPress={() => router.push("/marketplace")}
              >
                <Text style={styles.sectionActionText}>View all</Text>
              </Pressable>
            </View>
            {loadingMarketplace ? (
              <View style={styles.marketplaceLoading}>
                <View style={styles.marketplaceSkeleton} />
                <View style={styles.marketplaceSkeleton} />
              </View>
            ) : (
              <FlatList
                horizontal
                data={marketplaceProducts}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={renderMarketplaceItem}
                contentContainerStyle={styles.marketplaceListContent}
              />
            )}

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

            <View style={styles.footerBanner}>
              <View style={styles.footerBannerGlow} />
              <Text style={styles.footerBannerEyebrow}>TatVivah atelier</Text>
              <Text style={styles.footerBannerTitle}>
                Wedding-ready looks, styled to perfection
              </Text>
              <Text style={styles.footerBannerCopy}>
                Explore handcrafted silhouettes, premium fabrics, and bespoke
                details curated for celebrations across India.
              </Text>
              <Pressable
                style={styles.footerBannerButton}
                onPress={() => router.push("/marketplace")}
              >
                <Text style={styles.footerBannerButtonText}>Shop the edit</Text>
              </Pressable>
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
    </>
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
  sectionHeaderRow: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionAction: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.warmWhite,
  },
  sectionActionText: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.charcoal,
  },
  marketplaceListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  marketplaceCardWrap: {
    width: 240,
    marginRight: spacing.md,
    marginTop: spacing.md,
  },
  marketplaceLoading: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
  marketplaceSkeleton: {
    height: 320,
    width: 240,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
  },
  categoryRow: {
    marginTop: spacing.md,
    paddingLeft: spacing.lg,
  },
  categoryCard: {
    height: 160,
    width: 140,
    borderRadius: radius.lg,
    marginRight: spacing.md,
    overflow: "hidden",
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  categoryImage: {
    height: "100%",
    width: "100%",
  },
  categoryOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(44, 40, 37, 0.55)",
  },
  categoryLabel: {
    position: "absolute",
    bottom: 12,
    left: 12,
    fontFamily: typography.serif,
    fontSize: 14,
    color: colors.warmWhite,
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
  footerBanner: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: "#1F1A17",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#3C2E24",
  },
  footerBannerGlow: {
    position: "absolute",
    top: -80,
    right: -60,
    height: 180,
    width: 180,
    borderRadius: 90,
    backgroundColor: "#B7956C",
    opacity: 0.25,
  },
  footerBannerEyebrow: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "#D7C4B4",
  },
  footerBannerTitle: {
    marginTop: spacing.sm,
    fontFamily: typography.serif,
    fontSize: 24,
    color: "#F7F1EA",
  },
  footerBannerCopy: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 20,
    color: "#C9B6A6",
  },
  footerBannerButton: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    backgroundColor: "#B7956C",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  footerBannerButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#1F1A17",
  },
});
