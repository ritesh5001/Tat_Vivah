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
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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

const guestPicks = [
  {
    id: "g1",
    title: "Royal Sherwani Set",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "g2",
    title: "Signature Kurta Edit",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "g3",
    title: "Wedding Guest Essentials",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
  },
];

const heroSlides = [
  {
    title: "Crafted for Regal Grooms",
    subtitle: "Heritage silhouettes for majestic celebrations.",
    cta: "Explore Groom Collection",
    search: "sherwani",
  },
  {
    title: "Celebrate In Style",
    subtitle: "Modern wedding fashion crafted with elegance.",
    cta: "Shop Wedding Looks",
    search: "wedding",
  },
  {
    title: "For Every Celebration",
    subtitle: "From haldi to reception, complete your story.",
    cta: "Discover Collections",
    search: "kurta",
  },
  {
    title: "Luxury Meets Tradition",
    subtitle: "Premium wedding fashion for modern India.",
    cta: "Start Exploring",
    search: "indo western",
  },
  {
    title: "Wedding Section Edit",
    subtitle: "Statement ensembles curated for ceremonies and receptions.",
    cta: "Explore Wedding Edit",
    search: "wedding section",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const heroCardWidth = width;
  const [bestsellers, setBestsellers] = React.useState<BestsellerProduct[]>([]);
  const [loadingBestsellers, setLoadingBestsellers] = React.useState(true);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [arrivals, setArrivals] = React.useState<ProductSummary[]>([]);
  const [recentlyViewed, setRecentlyViewed] = React.useState<RecentlyViewedProduct[]>([]);
  const [recommendedProducts, setRecommendedProducts] = React.useState<ProductItem[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = React.useState<ProductItem[]>([]);
  const [loadingMarketplace, setLoadingMarketplace] = React.useState(true);
  const [activeHeroIndex, setActiveHeroIndex] = React.useState(0);

  const latestArrivals = React.useMemo(
    () => (arrivals.length ? arrivals : fallbackArrivals).slice(0, 3),
    [arrivals]
  );

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

  const handlePrivacyPolicyPress = React.useCallback(() => {
    router.push({ pathname: "/(tabs)/privacy-policy" as any });
  }, [router]);

  const handleLegalRoutePress = React.useCallback(
    (route: string) => {
      router.push({ pathname: route as any });
    },
    [router]
  );

  const handleExternalLink = React.useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const handleHeroMomentumEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroCardWidth);
      if (Number.isFinite(nextIndex)) {
        const bounded = Math.max(0, Math.min(nextIndex, images.hero.mobile.length - 1));
        setActiveHeroIndex(bounded);
      }
    },
    [heroCardWidth]
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
            contentPosition="top"
            transition={200}
            cachePolicy="memory-disk"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>{item.title}</Text>
            <Text style={styles.productDescription} numberOfLines={2}>
              Crafted edit for wedding celebrations.
            </Text>
            <Text style={styles.productCategory}>
              {item.categoryName ?? "Curated edit"}
            </Text>
            <Text style={styles.productPrice}>{formatPrice(item.minPrice)}</Text>
          </View>
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
          numColumns={2}
          columnWrapperStyle={styles.productGridRow}
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
            <View style={styles.heroCarouselWrap}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={heroCardWidth}
                decelerationRate="fast"
                contentContainerStyle={styles.heroCarouselContent}
                onMomentumScrollEnd={handleHeroMomentumEnd}
              >
                {images.hero.mobile.map((bannerImage, index) => {
                  const copy = heroSlides[index] ?? heroSlides[0];
                  return (
                    <View
                      key={`hero-slide-${index}`}
                      style={[styles.heroCard, { width: heroCardWidth }]}
                    >
                      <Image
                        source={bannerImage}
                        style={styles.heroBannerImage}
                        contentFit="cover"
                        contentPosition="top"
                        transition={220}
                        cachePolicy="memory-disk"
                      />
                      <LinearGradient
                        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.6)"]}
                        locations={[0, 0.55, 1]}
                        style={styles.heroBannerOverlay}
                      />
                      <View style={styles.heroContentLayer}>
                        <View style={styles.heroMetaRow}>
                          <Text style={styles.heroEyebrow}>Tatvivah atelier</Text>
                          <View style={styles.heroMetaPill}>
                            <Text style={styles.heroMetaPillText}>Premium edit</Text>
                          </View>
                        </View>
                        <Text style={styles.heroTitle}>{copy.title}</Text>
                        <Text style={styles.heroSubtitle}>{copy.subtitle}</Text>
                        <View style={styles.heroDivider} />
                        <View style={styles.heroActions}>
                          <Pressable
                            style={[styles.primaryButton, styles.heroPrimaryButton]}
                            onPress={() => router.push(`/search?q=${encodeURIComponent(copy.search)}`)}
                          >
                            <Text style={styles.primaryButtonText}>{copy.cta}</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.ghostButton, styles.heroGhostButton]}
                            onPress={() => router.push("/marketplace")}
                          >
                            <Text style={styles.ghostButtonText}>View Marketplace</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.heroDotsRow}>
                {images.hero.mobile.map((_, idx) => (
                  <View
                    key={`hero-dot-${idx}`}
                    style={[styles.heroDot, idx === activeHeroIndex && styles.heroDotActive]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.searchBlock}>
              <Text style={styles.searchTitle}>Find your look</Text>
              <Text style={styles.searchSubtitle}>
                Browse wedding fits, premium fabrics, and celebration-ready accessories.
              </Text>
              <Pressable style={styles.searchInputShell} onPress={() => router.push("/search")}>
                <TextInput
                  placeholder="Search sherwani, kurta, accessories"
                  placeholderTextColor={colors.brownSoft}
                  style={styles.searchInput}
                  onFocus={() => router.push("/search")}
                />
              </Pressable>
              <View style={styles.searchQuickRow}>
                <Pressable style={styles.searchQuickChip} onPress={() => router.push("/search?q=sherwani") }>
                  <Text style={styles.searchQuickChipText}>Sherwani</Text>
                </Pressable>
                <Pressable style={styles.searchQuickChip} onPress={() => router.push("/search?q=kurta") }>
                  <Text style={styles.searchQuickChipText}>Kurta</Text>
                </Pressable>
                <Pressable style={styles.searchQuickChip} onPress={() => router.push("/search?q=accessories") }>
                  <Text style={styles.searchQuickChipText}>Accessories</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionTransition} />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Latest drops</Text>
              <Text style={styles.sectionTitle}>New season arrivals</Text>
            </View>
            <View style={styles.latestStack}>
              {latestArrivals.map((item) => {
                const image = "image" in item ? item.image : item.images?.[0];
                const canNavigate = "images" in item;
                const rawPrice = "price" in item ? item.price : undefined;
                const price =
                  typeof rawPrice === "number" ? formatPrice(rawPrice) : undefined;

                return (
                  <Pressable
                    key={item.id}
                    style={styles.latestCard}
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
                      style={styles.latestImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                    <View style={styles.latestInfo}>
                      <Text style={styles.latestLabel}>Latest</Text>
                      <Text style={styles.latestTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.latestMeta}>
                        Premium tailoring for modern ceremonies
                      </Text>
                      {price ? (
                        <Text style={styles.latestPrice}>{price}</Text>
                      ) : null}
                      <View style={styles.latestCta}>
                        <Text style={styles.latestCtaText}>View details</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.promiseWrap}>
              <Text style={styles.sectionEyebrow}>Tatvivah promise</Text>
              <View style={styles.promiseRow}>
                <View style={styles.promiseCard}>
                  <Text style={styles.promiseTitle}>Verified ateliers</Text>
                  <Text style={styles.promiseCopy}>
                    Certified artisans and premium fabric sourcing.
                  </Text>
                </View>
                <View style={styles.promiseCard}>
                  <Text style={styles.promiseTitle}>Secure checkout</Text>
                  <Text style={styles.promiseCopy}>
                    Protected payments with order tracking.
                  </Text>
                </View>
                <View style={styles.promiseCard}>
                  <Text style={styles.promiseTitle}>Concierge care</Text>
                  <Text style={styles.promiseCopy}>
                    Styling support for every celebration.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionTransition} />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Shop by category</Text>
              <Text style={styles.sectionTitle}>Style edits</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryRow}
              contentContainerStyle={styles.categoryRowContent}
            >
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

            <View style={styles.sectionTransition} />
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

            <View style={styles.sectionTransition} />
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionEyebrow}>Curated collections</Text>
                <Text style={styles.sectionTitle}>Handpicked for you</Text>
                <Text style={styles.sectionSupportText}>
                  Signature picks selected by our in-house stylists.
                </Text>
              </View>
              <Pressable
                style={styles.sectionAction}
                onPress={() => router.push("/marketplace")}
              >
                <Text style={styles.sectionActionText}>View all</Text>
              </Pressable>
            </View>
            {loadingMarketplace ? (
              <View style={styles.marketplaceFeatureLoading}>
                <View style={styles.marketplaceFeatureSkeleton} />
                <View style={styles.marketplaceFeatureSkeleton} />
                <View style={styles.marketplaceFeatureSkeleton} />
              </View>
            ) : (
              <View style={styles.marketplaceFeatureList}>
                {marketplaceProducts.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.marketplaceFeatureCard}>
                    <ProductGridCard
                      product={item}
                      onExplore={() => handleProductPress(item.id)}
                      onBuyNow={() => handleProductPress(item.id)}
                    />
                  </View>
                ))}
              </View>
            )}

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
                  data={recommendedProducts}
                  keyExtractor={(item) => item.id}
                  renderItem={renderRecommendationItem}
                  numColumns={2}
                  columnWrapperStyle={styles.recommendationGridRow}
                  scrollEnabled={false}
                  contentContainerStyle={styles.recommendationGridContent}
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
                  contentContainerStyle={styles.horizontalContent}
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
            {recommendedProducts.length === 0 && recentlyViewed.length === 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionEyebrow}>Guest picks</Text>
                  <Text style={styles.sectionTitle}>Wedding-ready gifting</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalContent}
                >
                  {guestPicks.map((item) => (
                    <Pressable key={item.id} style={styles.arrivalCard}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.arrivalImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                      <Text style={styles.arrivalTitle}>{item.title}</Text>
                      <Text style={styles.arrivalPrice}>Premium edit</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>New arrivals</Text>
              <Text style={styles.sectionTitle}>Freshly tailored</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalContent}
            >
              {(arrivals.length ? arrivals : fallbackArrivals).map((item) => {
                const image = "image" in item ? item.image : item.images?.[0];
                const canNavigate = "images" in item;
                const rawPrice = "price" in item ? item.price : undefined;
                const price =
                  typeof rawPrice === "number" ? formatPrice(rawPrice) : undefined;
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

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Style journal</Text>
              <Text style={styles.sectionTitle}>Crafting celebrations</Text>
            </View>
            <View style={styles.editorialStack}>
              <View style={styles.editorialCard}>
                <Text style={styles.editorialTitle}>Signature edit</Text>
                <Text style={styles.editorialCopy}>
                  Curated looks for pre-wedding, main ceremony, and reception.
                </Text>
                <Pressable
                  style={styles.editorialCta}
                  onPress={() => router.push("/marketplace")}
                >
                  <Text style={styles.editorialCtaText}>Explore edits</Text>
                </Pressable>
              </View>
              <View style={styles.editorialCard}>
                <Text style={styles.editorialTitle}>Style concierge</Text>
                <Text style={styles.editorialCopy}>
                  Personalized fit guidance, fabric advice, and sizing support.
                </Text>
                <Pressable style={styles.editorialCta}>
                  <Text style={styles.editorialCtaText}>Talk to us</Text>
                </Pressable>
              </View>
            </View>

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

            <View style={styles.footerLinks}>
              <Text style={styles.footerLinksTitle}>Tatvivah Trends</Text>
              <View style={styles.footerLinkRow}>
                <Pressable
                  style={styles.footerLinkButton}
                  onPress={handlePrivacyPolicyPress}
                >
                  <Text style={styles.footerLinkText}>Privacy policy</Text>
                </Pressable>
                <Pressable
                  style={styles.footerLinkButton}
                  onPress={() => handleLegalRoutePress("/(tabs)/return-policy")}
                >
                  <Text style={styles.footerLinkText}>Return policy</Text>
                </Pressable>
                <Pressable
                  style={styles.footerLinkButton}
                  onPress={() => handleLegalRoutePress("/(tabs)/refund-policy")}
                >
                  <Text style={styles.footerLinkText}>Refund policy</Text>
                </Pressable>
                <Pressable
                  style={styles.footerLinkButton}
                  onPress={() => handleLegalRoutePress("/(tabs)/terms")}
                >
                  <Text style={styles.footerLinkText}>Terms</Text>
                </Pressable>
                <Pressable
                  style={styles.footerLinkButton}
                  onPress={() => handleLegalRoutePress("/(tabs)/contact")}
                >
                  <Text style={styles.footerLinkText}>Contact</Text>
                </Pressable>
                <Pressable
                  style={styles.footerLinkButton}
                  onPress={() => handleExternalLink("https://tatvivahtrends.com")}
                >
                  <Text style={styles.footerLinkText}>tatvivahtrends.com</Text>
                </Pressable>
              </View>
              <Text style={styles.footerSignature}>
                Made with ❤️ by Nextgenfusion team
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
    marginTop: spacing.md,
    marginHorizontal: 0,
    borderRadius: 0,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 0,
    overflow: "hidden",
    aspectRatio: 0.8,
  },
  heroCarouselWrap: {
    marginTop: spacing.md,
  },
  heroCarouselContent: {
    paddingHorizontal: 0,
  },
  heroBannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContentLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xxl,
  },
  heroDotsRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  heroDotActive: {
    width: 8,
    backgroundColor: "#E8DCC5",
  },
  heroGlowOne: {
    position: "absolute",
    top: -60,
    left: -40,
    height: 160,
    width: 160,
    borderRadius: 100,
    backgroundColor: colors.goldMuted,
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
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  heroMetaPill: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.warmWhite,
  },
  heroMetaPillText: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.brown,
  },
  heroTitle: {
    marginTop: spacing.sm,
    fontFamily: typography.serif,
    fontSize: 32,
    color: "#F5F1E8",
    fontWeight: "600",
    lineHeight: 38,
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    fontFamily: typography.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(245,241,232,0.85)",
  },
  heroDivider: {
    marginTop: spacing.md,
    height: 1,
    backgroundColor: "rgba(245,241,232,0.28)",
  },
  heroActions: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  heroPrimaryButton: {
    width: 164,
    backgroundColor: "#E8DCC5",
  },
  heroGhostButton: {
    width: 164,
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.4)",
  },
  primaryButton: {
    backgroundColor: colors.charcoal,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#1A1A1A",
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
    color: "#F5F1E8",
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  searchBlock: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  searchTitle: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: colors.charcoal,
  },
  searchSubtitle: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brownSoft,
  },
  searchInputShell: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  searchInput: {
    backgroundColor: colors.warmWhite,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: typography.sans,
    color: colors.charcoal,
  },
  searchQuickRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchQuickChip: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.warmWhite,
  },
  searchQuickChipText: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.charcoal,
  },
  latestStack: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  latestCard: {
    flexDirection: "row",
    width: "100%",
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    ...shadow.card,
  },
  latestImage: {
    width: 140,
    height: 160,
    backgroundColor: colors.cream,
  },
  latestInfo: {
    flex: 1,
    padding: spacing.md,
    gap: 6,
  },
  latestLabel: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.gold,
  },
  latestTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  latestMeta: {
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brownSoft,
  },
  latestPrice: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  latestCta: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: colors.charcoal,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 14,
  },
  latestCtaText: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTransition: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    height: 1,
    backgroundColor: colors.borderSoft,
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
    fontSize: 24,
    color: colors.charcoal,
  },
  sectionSupportText: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brownSoft,
  },
  promiseWrap: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  promiseRow: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  promiseCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  promiseTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  promiseCopy: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brownSoft,
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
    flex: 1,
    marginTop: spacing.md,
    padding: 0,
    borderRadius: 14,
    backgroundColor: "#1E1A17",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 5,
    overflow: "hidden",
  },
  productGridRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  productImage: {
    height: 220,
    backgroundColor: colors.surface,
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    marginTop: 0,
    fontFamily: typography.serif,
    fontSize: 18,
    color: "#F5F1E8",
    fontWeight: "600",
  },
  productDescription: {
    marginTop: spacing.xs,
    fontFamily: typography.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(245,241,232,0.7)",
  },
  productCategory: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(245,241,232,0.7)",
  },
  productPrice: {
    marginTop: spacing.xs,
    fontFamily: typography.serif,
    fontSize: 14,
    color: "#F5F1E8",
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
    minHeight: 268,
    marginTop: spacing.md,
    marginRight: spacing.md,
    padding: 0,
    borderRadius: 14,
    backgroundColor: "#1E1A17",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 5,
  },
  arrivalImage: {
    height: 200,
    backgroundColor: colors.surface,
  },
  arrivalTitle: {
    marginTop: spacing.sm,
    marginHorizontal: 16,
    fontFamily: typography.serif,
    fontSize: 16,
    color: "#F5F1E8",
    fontWeight: "600",
  },
  arrivalPrice: {
    marginTop: spacing.xs,
    marginHorizontal: 16,
    marginBottom: spacing.md,
    fontFamily: typography.sans,
    fontSize: 12,
    color: "rgba(245,241,232,0.7)",
  },
  editorialStack: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  editorialCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    ...shadow.card,
  },
  editorialTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  editorialCopy: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brownSoft,
  },
  editorialCta: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.charcoal,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 14,
  },
  editorialCtaText: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
  recommendationListContent: {
    paddingHorizontal: spacing.lg,
  },
  recommendationCardWrap: {
    flex: 1,
    marginTop: spacing.md,
  },
  recommendationGridContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  recommendationGridRow: {
    gap: spacing.md,
  },
  sectionHeaderRow: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  sectionAction: {
    marginTop: spacing.xs,
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
  marketplaceFeatureList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  marketplaceFeatureCard: {
    width: "100%",
  },
  marketplaceFeatureLoading: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  marketplaceFeatureSkeleton: {
    height: 320,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
  },
  categoryRow: {
    marginTop: spacing.md,
  },
  categoryRowContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  categoryCard: {
    height: 172,
    width: 152,
    borderRadius: radius.xl,
    marginRight: spacing.md,
    overflow: "hidden",
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
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
    height: 74,
    backgroundColor: "rgba(44, 40, 37, 0.55)",
  },
  categoryLabel: {
    position: "absolute",
    bottom: 16,
    left: 16,
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.warmWhite,
  },
  horizontalContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
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
  footerLinks: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  footerLinksTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  footerLinkRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  footerLinkButton: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.warmWhite,
  },
  footerLinkText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.charcoal,
  },
  footerSignature: {
    marginTop: spacing.md,
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
  },
});
