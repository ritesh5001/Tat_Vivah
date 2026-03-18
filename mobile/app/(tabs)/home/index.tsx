import React from "react";
import {
  FlatList,
  ListRenderItemInfo,
  InteractionManager,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, textStyles } from "../../../src/theme";
import { useProductsQuery } from "../../../src/hooks/useProductsQuery";
import { AppHeader } from "../../../src/components/AppHeader";
import { ReelsSection } from "../../../src/components/ReelsSection";
import { Footer } from "../../../src/components/Footer";
import { ScrollToTopFab } from "../../../src/components/ScrollToTopFab";
import { CachedImage } from "../../../src/components/CachedImage";
import { HomeHeroBanner } from "../../../src/components/HomeHeroBanner";
import { SkeletonBlock } from "../../../src/components/Skeleton";
import { images } from "../../../src/data/images";
import { AppText as Text, ScreenContainer as SafeAreaView } from "../../../src/components";
import { useQuery } from "@tanstack/react-query";
import {
  getCategories,
  getOccasions,
  type Category,
  type Occasion,
} from "../../../src/services/catalog";
import {
  getBestsellers,
  type BestsellerProduct,
} from "../../../src/services/bestsellers";

type HomeGridCard = {
  id: string;
  title: string;
  image: string;
  query: string;
};

type HomeGridPage = {
  id: string;
  items: HomeGridCard[];
};

type HomeProductCard = {
  id: string;
  title: string;
  image: string;
  priceText: string;
  query: string;
};

function chunkCards(cards: HomeGridCard[], size: number): HomeGridPage[] {
  const pages: HomeGridPage[] = [];
  for (let i = 0; i < cards.length; i += size) {
    const slice = cards.slice(i, i + size);
    pages.push({ id: `page-${i / size + 1}`, items: slice });
  }
  return pages;
}

function repeatCards(cards: HomeGridCard[], times: number): HomeGridCard[] {
  if (cards.length === 0) return [];
  const repeated: HomeGridCard[] = [];
  for (let i = 0; i < times; i += 1) {
    cards.forEach((card) => {
      repeated.push({
        ...card,
        id: `${card.id}-r${i + 1}`,
      });
    });
  }
  return repeated;
}

function repeatProductCards(cards: HomeProductCard[], times: number): HomeProductCard[] {
  if (cards.length === 0) return [];
  const repeated: HomeProductCard[] = [];
  for (let i = 0; i < times; i += 1) {
    cards.forEach((card) => {
      repeated.push({
        ...card,
        id: `${card.id}-r${i + 1}`,
      });
    });
  }
  return repeated;
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const spotlightQuery = useProductsQuery({ page: 1, limit: 8, sort: "newest" });
  const categoriesQuery = useQuery({
    queryKey: ["home-categories"],
    queryFn: getCategories,
    staleTime: 60 * 1000,
  });
  const occasionsQuery = useQuery({
    queryKey: ["home-occasions"],
    queryFn: getOccasions,
    staleTime: 60 * 1000,
  });
  const bestsellersQuery = useQuery({
    queryKey: ["home-bestsellers"],
    queryFn: () => getBestsellers(4),
    staleTime: 60 * 1000,
  });
  const mostLovedQuery = useProductsQuery({ page: 1, limit: 4, sort: "popularity" });

  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const listRef = React.useRef<FlatList<never> | null>(null);
  const testimonialRef = React.useRef<FlatList<typeof testimonials[number]> | null>(null);
  const [occasionRepeatCount, setOccasionRepeatCount] = React.useState(1);
  const [categoryRepeatCount, setCategoryRepeatCount] = React.useState(1);
  const [vibeRepeatCount, setVibeRepeatCount] = React.useState(1);
  const [mostLovedRepeatCount, setMostLovedRepeatCount] = React.useState(1);
  const [bestsellerRepeatCount, setBestsellerRepeatCount] = React.useState(1);
  const [occasionPageIndex, setOccasionPageIndex] = React.useState(0);
  const [categoryPageIndex, setCategoryPageIndex] = React.useState(0);
  const [vibePageIndex, setVibePageIndex] = React.useState(0);
  const [mostLovedPageIndex, setMostLovedPageIndex] = React.useState(0);
  const [bestsellerPageIndex, setBestsellerPageIndex] = React.useState(0);
  const [testimonialPageIndex, setTestimonialPageIndex] = React.useState(0);
  const testimonialIndexRef = React.useRef(0);
  const [isReelsReady, setIsReelsReady] = React.useState(false);

  React.useEffect(() => {
    testimonialIndexRef.current = testimonialPageIndex;
  }, [testimonialPageIndex]);

  React.useEffect(() => {
    let isCancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => {
        if (!isCancelled) {
          setIsReelsReady(true);
        }
      }, 700);
    });

    return () => {
      isCancelled = true;
      task.cancel();
      if (timer) clearTimeout(timer);
    };
  }, []);

  const deferNavigate = React.useCallback((to: string) => {
    InteractionManager.runAfterInteractions(() => {
      router.push(to as any);
    });
  }, [router]);

  const spotlightCards = React.useMemo(() => {
    const products = spotlightQuery.data?.data ?? [];
    if (products.length === 0) {
      return [
        { id: "s1", image: images.hero.mobile[0], title: "ROYAL WEDDING", productId: null, description: "" },
        { id: "s2", image: images.hero.mobile[2], title: "RECEPTION EDIT", productId: null, description: "" },
        { id: "s3", image: images.hero.mobile[4], title: "GROOM SPECIAL", productId: null, description: "" },
      ];
    }

    return products.slice(0, 3).map((product, index) => ({
      id: product.id,
      image: product.images?.[0] ?? images.hero.mobile[index % images.hero.mobile.length],
      title: product.title,
      productId: product.id,
      description: product.description,
    }));
  }, [spotlightQuery.data]);

  const spotlightCardHeight = Math.round(Math.min(Math.max(width * 1.05, 420), 560));
  const vibeCardWidth = Math.min(Math.max(width * 0.54, 194), 228);
  const vibeCardHeight = Math.round(vibeCardWidth * 1.32);
  const gridPageWidth = Math.max(width - spacing.pageHorizontal * 2, 280);
  const gridPageGap = spacing.md;
  const gridCardWidth = (gridPageWidth - gridPageGap) / 2;
  const productCardGap = spacing.md;
  const productCardWidth = gridPageWidth;
  const productCardHeight = Math.round(productCardWidth * 1.25);

  const fallbackGridImages = React.useMemo(
    () => [
      images.categories.wedding,
      images.categories.indoWestern,
      images.categories.kurta,
      images.categories.accessories,
      ...images.hero.mobile,
    ],
    []
  );

  const categoryCards = React.useMemo<HomeGridCard[]>(() => {
    const categories: Category[] = categoriesQuery.data?.categories ?? [];
    return categories.map((category, index) => ({
      id: category.id,
      title: (category.name || "Category").toUpperCase(),
      image:
        category.image?.trim() ||
        fallbackGridImages[index % fallbackGridImages.length],
      query: category.slug || category.name,
    }));
  }, [categoriesQuery.data, fallbackGridImages]);

  const occasionCards = React.useMemo<HomeGridCard[]>(() => {
    const occasions: Occasion[] = occasionsQuery.data?.occasions ?? [];
    return occasions.map((occasion, index) => ({
      id: occasion.id,
      title: (occasion.name || "Occasion").toUpperCase(),
      image:
        occasion.image?.trim() ||
        fallbackGridImages[index % fallbackGridImages.length],
      query: occasion.slug || occasion.name,
    }));
  }, [fallbackGridImages, occasionsQuery.data]);

  const vibeCards = React.useMemo(
    () => categoryCards.slice(0, 6),
    [categoryCards]
  );

  const repeatedOccasionCards = React.useMemo(
    () => repeatCards(occasionCards, occasionRepeatCount),
    [occasionCards, occasionRepeatCount]
  );

  const repeatedCategoryCards = React.useMemo(
    () => repeatCards(categoryCards, categoryRepeatCount),
    [categoryCards, categoryRepeatCount]
  );

  const repeatedVibeCards = React.useMemo(
    () => repeatCards(vibeCards, vibeRepeatCount),
    [vibeCards, vibeRepeatCount]
  );

  const mostLovedCards = React.useMemo<HomeProductCard[]>(() => {
    const products = mostLovedQuery.data?.data ?? [];
    return products.slice(0, 4).map((item, index) => ({
      id: item.id,
      title: item.title,
      image: item.images?.[0] ?? fallbackGridImages[index % fallbackGridImages.length],
      priceText:
        typeof item.price === "number"
          ? `₹${item.price.toLocaleString("en-IN")}`
          : "₹0",
      query: item.title,
    }));
  }, [fallbackGridImages, mostLovedQuery.data]);

  const bestsellerCards = React.useMemo<HomeProductCard[]>(() => {
    const products: BestsellerProduct[] = bestsellersQuery.data?.products ?? [];
    return products.map((item, index) => ({
      id: item.id,
      title: item.title,
      image: item.image?.trim() ?? fallbackGridImages[index % fallbackGridImages.length],
      priceText:
        typeof (item.salePrice ?? item.adminPrice ?? item.minPrice ?? item.regularPrice) === "number"
          ? `₹${Number(item.salePrice ?? item.adminPrice ?? item.minPrice ?? item.regularPrice).toLocaleString("en-IN")}`
          : "₹0",
      query: item.title,
    }));
  }, [bestsellersQuery.data, fallbackGridImages]);

  const repeatedMostLovedCards = React.useMemo(
    () => repeatProductCards(mostLovedCards, mostLovedRepeatCount),
    [mostLovedCards, mostLovedRepeatCount]
  );

  const repeatedBestsellerCards = React.useMemo(
    () => repeatProductCards(bestsellerCards, bestsellerRepeatCount),
    [bestsellerCards, bestsellerRepeatCount]
  );

  const visibleOccasionPages = React.useMemo(
    () => chunkCards(repeatedOccasionCards, 4),
    [repeatedOccasionCards]
  );

  const visibleCategoryPages = React.useMemo(
    () => chunkCards(repeatedCategoryCards, 4),
    [repeatedCategoryCards]
  );

  const baseOccasionPagesCount = Math.max(1, Math.ceil(occasionCards.length / 4));
  const baseCategoryPagesCount = Math.max(1, Math.ceil(categoryCards.length / 4));
  const baseVibePagesCount = Math.max(1, vibeCards.length);
  const baseMostLovedPagesCount = Math.max(1, mostLovedCards.length);
  const baseBestsellerPagesCount = Math.max(1, bestsellerCards.length);

  const loadMoreOccasions = React.useCallback(() => {
    if (occasionCards.length === 0) return;
    setOccasionRepeatCount((prev) => prev + 1);
  }, [occasionCards.length]);

  const loadMoreCategories = React.useCallback(() => {
    if (categoryCards.length === 0) return;
    setCategoryRepeatCount((prev) => prev + 1);
  }, [categoryCards.length]);

  const loadMoreVibe = React.useCallback(() => {
    if (vibeCards.length === 0) return;
    setVibeRepeatCount((prev) => prev + 1);
  }, [vibeCards.length]);

  const loadMoreMostLoved = React.useCallback(() => {
    if (mostLovedCards.length === 0) return;
    setMostLovedRepeatCount((prev) => prev + 1);
  }, [mostLovedCards.length]);

  const loadMoreBestsellers = React.useCallback(() => {
    if (bestsellerCards.length === 0) return;
    setBestsellerRepeatCount((prev) => prev + 1);
  }, [bestsellerCards.length]);

  React.useEffect(() => {
    setOccasionRepeatCount(1);
    setOccasionPageIndex(0);
  }, [occasionCards.length]);

  React.useEffect(() => {
    setCategoryRepeatCount(1);
    setCategoryPageIndex(0);
  }, [categoryCards.length]);

  React.useEffect(() => {
    setVibeRepeatCount(1);
    setVibePageIndex(0);
  }, [vibeCards.length]);

  React.useEffect(() => {
    setMostLovedRepeatCount(1);
    setMostLovedPageIndex(0);
  }, [mostLovedCards.length]);

  React.useEffect(() => {
    setBestsellerRepeatCount(1);
    setBestsellerPageIndex(0);
  }, [bestsellerCards.length]);

  const renderGridPage = React.useCallback(
    ({ item }: ListRenderItemInfo<HomeGridPage>) => (
      <View style={[styles.gridPage, { width: gridPageWidth }]}> 
        {item.items.map((card) => (
          <Pressable
            key={card.id}
            style={[styles.occasionCard, { width: gridCardWidth }]}
            onPress={() => deferNavigate(`/search?q=${encodeURIComponent(card.query)}`)}
          >
            <CachedImage
              source={card.image}
              style={styles.occasionCardImage}
              contentFit="cover"
            />
            <View style={styles.occasionCardOverlay} />
            <Text style={styles.occasionCardTitle}>{card.title}</Text>
          </Pressable>
        ))}
      </View>
    ),
    [deferNavigate, gridCardWidth, gridPageWidth]
  );

  const renderVibeCard = React.useCallback(
    ({ item }: ListRenderItemInfo<HomeGridCard>) => (
      <Pressable
        style={[
          styles.vibeCard,
          { width: vibeCardWidth, height: vibeCardHeight },
        ]}
        onPress={() => deferNavigate(`/search?q=${encodeURIComponent(item.query)}`)}
      >
        <CachedImage
          source={item.image}
          style={{ width: vibeCardWidth, height: vibeCardHeight }}
          contentFit="cover"
        />
        <View style={styles.vibeCardOverlay} />
        <Text style={styles.vibeCardTitle}>{item.title}</Text>
      </Pressable>
    ),
    [deferNavigate, vibeCardHeight, vibeCardWidth]
  );

  const renderLargeProductCard = React.useCallback(
    ({ item }: ListRenderItemInfo<HomeProductCard>) => (
      <Pressable
        style={[styles.largeProductCard, { width: productCardWidth }]}
        onPress={() => deferNavigate(`/search?q=${encodeURIComponent(item.query)}`)}
      >
        <CachedImage
          source={item.image}
          style={[styles.largeProductImage, { height: productCardHeight }]}
          contentFit="cover"
        />
        <View style={styles.largeProductOverlay} />
        <View style={styles.largeProductMeta}>
          <Text numberOfLines={1} style={styles.largeProductTitle}>{item.title}</Text>
          <Text style={styles.largeProductPrice}>{item.priceText}</Text>
        </View>
      </Pressable>
    ),
    [deferNavigate, productCardHeight, productCardWidth]
  );

  const testimonials = React.useMemo(
    () => [
      {
        id: "t1",
        name: "Aditya Verma",
        quote:
          "Perfect fit and premium fabric quality. Delivery was smooth and right on time.",
      },
      {
        id: "t2",
        name: "Rohan Singh",
        quote:
          "The wedding collection looked even better in person. Great styling support too.",
      },
      {
        id: "t3",
        name: "Karan Malhotra",
        quote:
          "Elegant designs with comfortable wear for long events. Highly recommended.",
      },
    ],
    []
  );

  const spotlightFeature = spotlightCards[0];

  React.useEffect(() => {
    if (!testimonials.length) return;
    const interval = setInterval(() => {
      const next = (testimonialIndexRef.current + 1) % testimonials.length;
      testimonialRef.current?.scrollToOffset({
        offset: next * gridPageWidth,
        animated: true,
      });
      testimonialIndexRef.current = next;
      setTestimonialPageIndex(next);
    }, 5000);
    return () => clearInterval(interval);
  }, [gridPageWidth, testimonials.length]);

  const handleScroll = React.useCallback((offsetY: number) => {
    const shouldShow = offsetY > 260;
    setShowScrollTop((prev) => (prev === shouldShow ? prev : shouldShow));
  }, []);

  const handleScrollToTop = React.useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const listHeader = React.useMemo(() => (
    <>
      <View style={styles.fullBleed}>
        <HomeHeroBanner onPress={() => deferNavigate("/marketplace")} />
      </View>

      <View style={styles.vibeSection}>
        <View style={styles.vibeHeadingWrap}>
          <Ionicons name="sparkles-outline" size={30} color="#511d00" />
          <Text style={styles.vibeTitle}>WHAT&apos;S YOUR VIBE?</Text>
          <Text style={styles.scrollDirectionText}>Swipe left or right</Text>
        </View>
        <FlatList
          horizontal
          data={repeatedVibeCards}
          keyExtractor={(item) => item.id}
          renderItem={renderVibeCard}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews
          onEndReached={loadMoreVibe}
          onEndReachedThreshold={0.5}
          snapToInterval={vibeCardWidth + spacing.md}
          decelerationRate="fast"
          disableIntervalMomentum
          snapToAlignment="start"
          onMomentumScrollEnd={(event) => {
            const page = Math.round(
              event.nativeEvent.contentOffset.x / (vibeCardWidth + spacing.md)
            );
            setVibePageIndex(page);
          }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vibeCarouselContent}
        />
        <View style={styles.paginationWrap}>
          {Array.from({ length: baseVibePagesCount }).map((_, idx) => {
            const isActive = idx === (vibePageIndex % baseVibePagesCount);
            return <View key={`vibe-dot-${idx}`} style={[styles.paginationDot, isActive && styles.paginationDotActive]} />;
          })}
        </View>
      </View>

      <View style={styles.occasionSection}>
        <View style={styles.occasionHeadingWrap}>
          <Ionicons name="sparkles-outline" size={30} color="#511d00" />
          <Text style={styles.occasionTitle}>SHOP THE OCCASION</Text>
          <View style={styles.menTabWrap}>
            <Text style={styles.menTabText}>Men</Text>
            <View style={styles.menTabUnderline} />
          </View>
          <Text style={styles.scrollDirectionText}>Swipe left or right</Text>
        </View>
        {occasionsQuery.isLoading ? (
          <View style={styles.gridLoadingWrap}>
            <SkeletonBlock width="47%" height={170} />
            <SkeletonBlock width="47%" height={170} />
            <SkeletonBlock width="47%" height={170} />
            <SkeletonBlock width="47%" height={170} />
          </View>
        ) : visibleOccasionPages.length === 0 ? (
          <View style={styles.gridEmptyState}>
            <Text style={styles.gridEmptyText}>No occasions available right now.</Text>
          </View>
        ) : (
          <FlatList
            data={visibleOccasionPages}
            keyExtractor={(item) => item.id}
            renderItem={renderGridPage}
            horizontal
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews
            decelerationRate="fast"
            disableIntervalMomentum
            snapToAlignment="start"
            snapToInterval={gridPageWidth + gridPageGap}
            style={styles.gridViewport}
            contentContainerStyle={styles.occasionGrid}
            ItemSeparatorComponent={() => <View style={{ width: gridPageGap }} />}
            onEndReached={loadMoreOccasions}
            onEndReachedThreshold={0.4}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const page = Math.round(
                event.nativeEvent.contentOffset.x / (gridPageWidth + gridPageGap)
              );
              setOccasionPageIndex(page);
            }}
          />
        )}
        {visibleOccasionPages.length > 0 ? (
          <View style={styles.paginationWrap}>
            {Array.from({ length: baseOccasionPagesCount }).map((_, idx) => {
              const isActive = idx === (occasionPageIndex % baseOccasionPagesCount);
              return <View key={`occasion-dot-${idx}`} style={[styles.paginationDot, isActive && styles.paginationDotActive]} />;
            })}
          </View>
        ) : null}
      </View>

      <View style={styles.spotlightSection}>
        <View style={styles.spotlightHeadingWrap}>
          <Ionicons name="sparkles-outline" size={30} color="#511d00" />
          <Text style={styles.spotlightHeading}>IN THE SPOTLIGHT</Text>
        </View>
        <Pressable
          style={[styles.spotlightFeatureCard, { height: spotlightCardHeight }]}
          onPress={() =>
            spotlightFeature?.productId
              ? deferNavigate(`/product/${spotlightFeature.productId}`)
              : deferNavigate("/marketplace")
          }
        >
          {spotlightQuery.isLoading ? (
            <View style={styles.spotlightSkeletonWrap}>
              <SkeletonBlock width="100%" height={spotlightCardHeight} borderRadius={12} />
            </View>
          ) : (
            <>
              <CachedImage
                source={spotlightFeature?.image ?? images.hero.mobile[2]}
                style={styles.spotlightImage}
                contentFit="cover"
              />
              <View style={styles.spotlightOverlay} />
              <View style={styles.spotlightActionWrapBottom}>
                <Text style={styles.spotlightActionText}>EXPLORE NOW</Text>
              </View>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.collectionSection}>
        <View style={styles.sectionHeadRow}>
          <Ionicons name="sparkles-outline" size={28} color="#511d00" />
          <Text style={styles.collectionHeading}>SHOP BY CATEGORY</Text>
        </View>
        <Text style={[styles.scrollDirectionText, styles.centerDirection]}>Swipe left or right</Text>
        {categoriesQuery.isLoading ? (
          <View style={styles.gridLoadingWrap}>
            <SkeletonBlock width="47%" height={170} />
            <SkeletonBlock width="47%" height={170} />
            <SkeletonBlock width="47%" height={170} />
            <SkeletonBlock width="47%" height={170} />
          </View>
        ) : visibleCategoryPages.length === 0 ? (
          <View style={styles.gridEmptyState}>
            <Text style={styles.gridEmptyText}>No categories available right now.</Text>
          </View>
        ) : (
          <FlatList
            data={visibleCategoryPages}
            keyExtractor={(item) => item.id}
            renderItem={renderGridPage}
            horizontal
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews
            decelerationRate="fast"
            disableIntervalMomentum
            snapToAlignment="start"
            snapToInterval={gridPageWidth + gridPageGap}
            style={styles.gridViewport}
            contentContainerStyle={styles.occasionGrid}
            ItemSeparatorComponent={() => <View style={{ width: gridPageGap }} />}
            onEndReached={loadMoreCategories}
            onEndReachedThreshold={0.4}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const page = Math.round(
                event.nativeEvent.contentOffset.x / (gridPageWidth + gridPageGap)
              );
              setCategoryPageIndex(page);
            }}
          />
        )}
        {visibleCategoryPages.length > 0 ? (
          <View style={styles.paginationWrap}>
            {Array.from({ length: baseCategoryPagesCount }).map((_, idx) => {
              const isActive = idx === (categoryPageIndex % baseCategoryPagesCount);
              return <View key={`category-dot-${idx}`} style={[styles.paginationDot, isActive && styles.paginationDotActive]} />;
            })}
          </View>
        ) : null}
      </View>

      <View style={styles.mostLovedSection}>
        <View style={styles.mostLovedHeaderRow}>
          <Ionicons name="sparkles-outline" size={28} color="#511d00" />
          <Text style={styles.mostLovedHeading}>MOST LOVED</Text>
          <Text style={styles.scrollDirectionText}>Swipe left or right</Text>
        </View>
        {mostLovedQuery.isLoading ? (
          <View style={styles.gridLoadingWrap}>
            <SkeletonBlock width="74%" height={320} />
          </View>
        ) : repeatedMostLovedCards.length === 0 ? (
          <View style={styles.gridEmptyState}>
            <Text style={styles.gridEmptyText}>No loved products available right now.</Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={repeatedMostLovedCards}
            keyExtractor={(item) => item.id}
            renderItem={renderLargeProductCard}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews
            contentContainerStyle={styles.largeProductList}
            showsHorizontalScrollIndicator={false}
            onEndReached={loadMoreMostLoved}
            onEndReachedThreshold={0.4}
            snapToInterval={productCardWidth + productCardGap}
            decelerationRate="fast"
            disableIntervalMomentum
            snapToAlignment="start"
            onMomentumScrollEnd={(event) => {
              const page = Math.round(
                event.nativeEvent.contentOffset.x / (productCardWidth + productCardGap)
              );
              setMostLovedPageIndex(page);
            }}
          />
        )}
        <View style={styles.paginationWrap}>
          {Array.from({ length: baseMostLovedPagesCount }).map((_, idx) => {
            const isActive = idx === (mostLovedPageIndex % baseMostLovedPagesCount);
            return <View key={`most-loved-dot-${idx}`} style={[styles.paginationDot, isActive && styles.paginationDotActive]} />;
          })}
        </View>
      </View>

      <View style={styles.mostLovedSection}>
        <View style={styles.mostLovedHeaderRow}>
          <Ionicons name="sparkles-outline" size={28} color="#511d00" />
          <Text style={styles.mostLovedHeading}>BEST SELLERS</Text>
          <Text style={styles.scrollDirectionText}>Swipe left or right</Text>
        </View>
        {bestsellersQuery.isLoading ? (
          <View style={styles.gridLoadingWrap}>
            <SkeletonBlock width="74%" height={320} />
          </View>
        ) : repeatedBestsellerCards.length === 0 ? (
          <View style={styles.gridEmptyState}>
            <Text style={styles.gridEmptyText}>No bestsellers available right now.</Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={repeatedBestsellerCards}
            keyExtractor={(item) => item.id}
            renderItem={renderLargeProductCard}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews
            contentContainerStyle={styles.largeProductList}
            showsHorizontalScrollIndicator={false}
            onEndReached={loadMoreBestsellers}
            onEndReachedThreshold={0.4}
            snapToInterval={productCardWidth + productCardGap}
            decelerationRate="fast"
            disableIntervalMomentum
            snapToAlignment="start"
            onMomentumScrollEnd={(event) => {
              const page = Math.round(
                event.nativeEvent.contentOffset.x / (productCardWidth + productCardGap)
              );
              setBestsellerPageIndex(page);
            }}
          />
        )}
        <View style={styles.paginationWrap}>
          {Array.from({ length: baseBestsellerPagesCount }).map((_, idx) => {
            const isActive = idx === (bestsellerPageIndex % baseBestsellerPagesCount);
            return <View key={`bestseller-dot-${idx}`} style={[styles.paginationDot, isActive && styles.paginationDotActive]} />;
          })}
        </View>
      </View>

      <View style={styles.testimonialSection}>
        <View style={styles.sectionHeadRow}>
          <Ionicons name="sparkles-outline" size={28} color="#511d00" />
          <Text style={styles.testimonialHeading}>TESTIMONIALS</Text>
        </View>
        <FlatList
          ref={testimonialRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          data={testimonials}
          keyExtractor={(item) => item.id}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={3}
          removeClippedSubviews
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.testimonialViewport}
          renderItem={({ item }) => {
            const quoteText = item.quote?.trim() || "TatVivah delivered premium quality, true-to-photo finish, and a smooth wedding-day experience.";
            const nameText = item.name?.trim() || "TatVivah Customer";

            return (
              <View style={[styles.testimonialCardLarge, { width: gridPageWidth }]}> 
                <Text style={styles.testimonialQuoteLarge}>{`"${quoteText}"`}</Text>
                <Text style={styles.testimonialName}>{nameText}</Text>
                <Text style={styles.testimonialMeta}>Verified Purchase</Text>
              </View>
            );
          }}
          onMomentumScrollEnd={(event) => {
            const page = Math.round(event.nativeEvent.contentOffset.x / gridPageWidth);
            setTestimonialPageIndex(page);
          }}
        />
        <View style={styles.paginationWrap}>
          {testimonials.map((item, idx) => (
            <View
              key={item.id}
              style={[styles.paginationDot, idx === testimonialPageIndex && styles.paginationDotActive]}
            />
          ))}
        </View>
      </View>


      <View style={styles.section}>
        <Text style={[textStyles.sectionTitle, styles.sectionTitleCenter]}>
          TRENDING REELS
        </Text>
        <ReelsSection
          enableFetch={isReelsReady}
          onPressReel={(query) =>
            deferNavigate(`/search?q=${encodeURIComponent(query)}`)
          }
        />
      </View>

      <View style={styles.fullBleed}>
        <Footer />
      </View>
    </>
  ), [
    categoriesQuery.isLoading,
    deferNavigate,
    baseCategoryPagesCount,
    baseOccasionPagesCount,
    baseVibePagesCount,
    baseMostLovedPagesCount,
    baseBestsellerPagesCount,
    bestsellersQuery.isLoading,
    categoryPageIndex,
    gridPageGap,
    gridPageWidth,
    loadMoreBestsellers,
    loadMoreCategories,
    loadMoreMostLoved,
    loadMoreOccasions,
    loadMoreVibe,
    mostLovedPageIndex,
    mostLovedQuery.isLoading,
    occasionPageIndex,
    occasionsQuery.isLoading,
    renderLargeProductCard,
    renderGridPage,
    renderVibeCard,
    productCardGap,
    productCardWidth,
    repeatedBestsellerCards,
    repeatedMostLovedCards,
    spotlightCardHeight,
    spotlightFeature,
    spotlightQuery.isLoading,
    testimonials,
    testimonialPageIndex,
    bestsellerPageIndex,
    visibleCategoryPages,
    visibleOccasionPages,
    repeatedVibeCards,
    vibePageIndex,
    vibeCardWidth,
    isReelsReady,
  ]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader variant="main" />
      <FlatList
        ref={listRef}
        data={[]}
        keyExtractor={(_item, index) => String(index)}
        renderItem={() => null}
        ListHeaderComponent={listHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        removeClippedSubviews
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={30}
        initialNumToRender={4}
        windowSize={5}
        onScroll={(event) => handleScroll(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      />

      <ScrollToTopFab
        visible={showScrollTop}
        onPress={handleScrollToTop}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: 0,
    paddingBottom: 0,
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.md,
    marginTop: 35,
  },
  sectionTitleCenter: {
    color: colors.textPrimary,
    textAlign: "center",
  },
  fullBleed: {
    marginHorizontal: -spacing.pageHorizontal,
  },
  vibeSection: {
    marginTop: 35,
    gap: spacing.md,
  },
  vibeHeadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  vibeTitle: {
    ...textStyles.sectionTitle,
    color: colors.headerBrown,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  vibeCarouselContent: {
    gap: spacing.md,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
  },
  vibeCard: {
    borderTopLeftRadius: 96,
    borderTopRightRadius: 96,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#7B4C2C",
    backgroundColor: "#D9CEC2",
    justifyContent: "flex-end",
  },
  vibeCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(36, 22, 12, 0.22)",
  },
  vibeCardTitle: {
    ...textStyles.sectionTitle,
    position: "absolute",
    bottom: spacing.sm,
    width: "100%",
    textAlign: "center",
    color: "#FFF8EE",
    letterSpacing: 1,
    fontSize: 26,
  },
  occasionSection: {
    backgroundColor: "transparent",
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: spacing.md,
    marginTop: 35,
  },
  occasionHeadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  occasionTitle: {
    ...textStyles.sectionTitle,
    color: "#17120E",
    textTransform: "uppercase",
    letterSpacing: 2.2,
    fontSize: 22,
  },
  menTabWrap: {
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  menTabText: {
    ...textStyles.sectionTitle,
    color: "#111111",
    textTransform: "none",
    fontSize: 18,
  },
  menTabUnderline: {
    width: 86,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.primaryAccent,
  },
  occasionGrid: {
    marginTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  gridPage: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  gridViewport: {
    minHeight: 470,
  },
  gridLoadingWrap: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  gridEmptyState: {
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  gridEmptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  occasionCard: {
    aspectRatio: 0.76,
    borderRadius: 0,
    overflow: "hidden",
    // backgroundColor: "#D7CCBC",
    justifyContent: "flex-end",
    borderWidth: 1.5,
    borderColor: "#7B4C2C",
  },
  occasionCardImage: {
    width: "100%",
    height: "100%",
  },
  occasionCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.14)",
  },
  occasionCardTitle: {
    ...textStyles.sectionTitle,
    position: "absolute",
    bottom: spacing.sm,
    width: "100%",
    textAlign: "center",
    color: "#FFF9F1",
    letterSpacing: 1.1,
    fontSize: 17,
  },
  spotlightSection: {
    backgroundColor: "transparent",
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: spacing.md,
    marginTop: 35,
  },
  spotlightHeadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  spotlightHeading: {
    ...textStyles.sectionTitle,
    color: "#17120E",
    textTransform: "uppercase",
    letterSpacing: 3.2,
    fontSize: 24,
  },
  spotlightFeatureCard: {
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#E8E3DA",
    borderWidth: 1.5,
    borderColor: "#7B4C2C",
  },
  spotlightImage: {
    width: "100%",
    height: "100%",
  },
  spotlightSkeletonWrap: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  spotlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
  },
  spotlightActionWrapBottom: {
    position: "absolute",
    bottom: spacing.lg,
    alignSelf: "center",
    borderRadius: 0,
    backgroundColor: "#b7956c",
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#8C6A2B",
  },
  spotlightActionText: {
    color: "#FFF8EA",
    fontSize: 14,
    letterSpacing: 1.6,
    fontWeight: "700",
  },
  sectionHeadRow: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  collectionSection: {
    marginTop: 35,
    gap: spacing.md,
  },
  scrollDirectionText: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  centerDirection: {
    textAlign: "center",
  },
  paginationWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.sm,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(123, 76, 44, 0.28)",
  },
  paginationDotActive: {
    backgroundColor: "#7B4C2C",
    width: 8,
    height: 8,
  },
  collectionHeading: {
    ...textStyles.sectionTitle,
    color: colors.textPrimary,
    letterSpacing: 1.8,
    fontSize: 22,
  },
  mostLovedSection: {
    marginTop: 35,
    gap: spacing.md,
  },
  mostLovedHeaderRow: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  mostLovedTitleWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  mostLovedHeading: {
    ...textStyles.sectionTitle,
    color: colors.textPrimary,
    letterSpacing: 1.8,
    fontSize: 22,
    textAlign: "center",
  },
  largeProductList: {
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  largeProductCard: {
    borderWidth: 1.5,
    borderColor: "#7B4C2C",
    backgroundColor: "#D7CCBC",
    overflow: "hidden",
  },
  largeProductImage: {
    width: "100%",
    height: 360,
  },
  largeProductOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.10)",
  },
  largeProductMeta: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    alignItems: "center",
  },
  largeProductTitle: {
    ...textStyles.sectionTitle,
    color: "#FFF9F1",
    letterSpacing: 1.0,
    fontSize: 22,
    textAlign: "center",
  },
  largeProductPrice: {
    marginTop: spacing.xs,
    color: "#FBE8BE",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  testimonialSection: {
    marginTop: 35,
    gap: spacing.md,
  },
  testimonialHeading: {
    ...textStyles.sectionTitle,
    color: colors.textPrimary,
    letterSpacing: 1.8,
    fontSize: 22,
  },
  testimonialViewport: {
    paddingHorizontal: 0,
  },
  testimonialCardLarge: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: "#7B4C2C",
    borderRadius: 0,
    backgroundColor: "#F8F1E5",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  testimonialQuoteLarge: {
    fontSize: 16,
    lineHeight: 24,
    color: "#2B2119",
  },
  testimonialName: {
    marginTop: spacing.xs,
    fontSize: 12,
    letterSpacing: 0.4,
    fontFamily: "Inter_500Medium",
    color: "#5B4030",
  },
  testimonialMeta: {
    marginTop: 2,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#7B5C47",
  },
});
