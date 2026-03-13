import React from "react";
import {
  Animated,
  Easing,
  FlatList,
  InteractionManager,
  Pressable,
  ScrollView,
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

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const spotlightQuery = useProductsQuery({ page: 1, limit: 8, sort: "newest" });

  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const listRef = React.useRef<FlatList<never> | null>(null);
  const testimonialTranslateX = React.useRef(new Animated.Value(0)).current;

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

  const vibeCards = React.useMemo(
    () => [
      { id: "v1", title: "SHERWANI", image: images.categories.wedding, query: "sherwani" },
      { id: "v2", title: "INDO WESTERN", image: images.categories.indoWestern, query: "indo western" },
      { id: "v3", title: "KURTA", image: images.categories.kurta, query: "kurta" },
    ],
    []
  );

  const occasionCards = React.useMemo(
    () => [
      { id: "o1", title: "WEDDING", image: images.hero.mobile[4], query: "wedding sherwani" },
      { id: "o2", title: "RECEPTION", image: images.hero.mobile[2], query: "reception" },
      { id: "o3", title: "ENGAGEMENT", image: images.hero.mobile[1], query: "engagement" },
      { id: "o4", title: "SANGEET", image: images.hero.mobile[0], query: "sangeet" },
    ],
    []
  );

  const collectionCards = React.useMemo(
    () => [
      { id: "cl1", title: "COCKTAIL COLLECTION", image: images.hero.mobile[3], query: "cocktail" },
      { id: "cl2", title: "FESTIVE COLLECTION", image: images.categories.kurta, query: "festive" },
      { id: "cl3", title: "ENGAGEMENT COLLECTION", image: images.hero.mobile[1], query: "engagement" },
      { id: "cl4", title: "HALDI COLLECTION", image: images.hero.mobile[0], query: "haldi" },
      { id: "cl5", title: "MEHENDI COLLECTION", image: images.hero.mobile[4], query: "mehendi" },
    ],
    []
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
    testimonialTranslateX.setValue(0);
    const loop = Animated.loop(
      Animated.timing(testimonialTranslateX, {
        toValue: -420,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [testimonialTranslateX]);

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
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vibeCarouselContent}
        >
          {vibeCards.map((card) => (
            <Pressable
              key={card.id}
              style={[
                styles.vibeCard,
                { width: vibeCardWidth, height: vibeCardHeight },
              ]}
              onPress={() => deferNavigate(`/search?q=${encodeURIComponent(card.query)}`)}
            >
              <CachedImage
                source={card.image}
                style={{ width: vibeCardWidth, height: vibeCardHeight }}
                contentFit="cover"
              />
              <View style={styles.vibeCardOverlay} />
              <Text style={styles.vibeCardTitle}>{card.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.occasionSection}>
        <View style={styles.occasionHeadingWrap}>
          <Ionicons name="sparkles-outline" size={30} color="#511d00" />
          <Text style={styles.occasionTitle}>SHOP THE OCCASION</Text>
          <View style={styles.menTabWrap}>
            <Text style={styles.menTabText}>Men</Text>
            <View style={styles.menTabUnderline} />
          </View>
        </View>
        <View style={styles.occasionGrid}>
          {occasionCards.map((card) => (
            <Pressable
              key={card.id}
              style={styles.occasionCard}
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
                contentFit="contain"
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
          <Text style={styles.collectionHeading}>SHOP BY COLLECTION</Text>
        </View>
        <View style={styles.collectionStack}>
          {collectionCards.map((card) => (
            <Pressable
              key={card.id}
              style={styles.collectionCardVertical}
              onPress={() => deferNavigate(`/search?q=${encodeURIComponent(card.query)}`)}
            >
              <CachedImage source={card.image} style={styles.collectionImageVertical} contentFit="cover" />
              <View style={styles.collectionOverlay} />
              <Text style={styles.collectionTitle}>{card.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.testimonialSection}>
        <View style={styles.sectionHeadRow}>
          <Ionicons name="sparkles-outline" size={28} color="#511d00" />
          <Text style={styles.testimonialHeading}>TESTIMONIALS</Text>
        </View>
        <View style={styles.testimonialViewport}>
          <Animated.View style={[styles.testimonialTrack, { transform: [{ translateX: testimonialTranslateX }] }]}>
            {[...testimonials, ...testimonials].map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.testimonialCardLarge}>
                <Text style={styles.testimonialQuoteLarge}>"{item.quote}"</Text>
                <Text style={styles.testimonialName}>{item.name}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>


      <View style={styles.section}>
        <Text style={[textStyles.sectionTitle, styles.sectionTitleCenter]}>
          TRENDING REELS
        </Text>
        <ReelsSection
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
    collectionCards,
    deferNavigate,
    occasionCards,
    spotlightCardHeight,
    spotlightFeature,
    spotlightQuery.isLoading,
    testimonials,
    vibeCardHeight,
    vibeCardWidth,
    vibeCards,
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
    paddingTop: spacing.xxl,
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
    borderColor: "#E3D4C2",
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
    backgroundColor: "#F5EFE1",
    marginHorizontal: -spacing.pageHorizontal,
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.xl,
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
    columnGap: spacing.md,
    marginTop: spacing.sm,
  },
  occasionCard: {
    width: "47%",
    aspectRatio: 0.76,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#D7CCBC",
    justifyContent: "flex-end",
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
    backgroundColor: "#F5EFE1",
    marginHorizontal: -spacing.pageHorizontal,
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.xl,
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
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#E8E3DA",
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
    borderRadius: 999,
    backgroundColor: "#F9F7F2",
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(34, 23, 16, 0.12)",
  },
  spotlightActionText: {
    color: "#221710",
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
    marginTop: 12,
    gap: spacing.md,
  },
  collectionHeading: {
    ...textStyles.sectionTitle,
    color: colors.textPrimary,
    letterSpacing: 1.8,
    fontSize: 22,
  },
  collectionStack: {
    gap: spacing.md,
  },
  collectionCardVertical: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#D7CCBC",
    borderWidth: 1,
    borderColor: "#E3D4C2",
    justifyContent: "flex-end",
  },
  collectionImageVertical: {
    width: "100%",
    height: "100%",
  },
  collectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  collectionTitle: {
    ...textStyles.sectionTitle,
    position: "absolute",
    bottom: spacing.sm,
    width: "100%",
    textAlign: "center",
    color: "#FFF8EE",
    fontSize: 18,
    letterSpacing: 1.1,
  },
  testimonialSection: {
    marginTop: 8,
    gap: spacing.md,
  },
  testimonialHeading: {
    ...textStyles.sectionTitle,
    color: colors.textPrimary,
    letterSpacing: 1.8,
    fontSize: 22,
  },
  testimonialViewport: {
    overflow: "hidden",
    marginHorizontal: -spacing.pageHorizontal,
    paddingHorizontal: spacing.pageHorizontal,
  },
  testimonialTrack: {
    flexDirection: "row",
    gap: spacing.md,
  },
  testimonialCardLarge: {
    width: 360,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: "#F8F1E5",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  testimonialQuoteLarge: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  testimonialName: {
    marginTop: spacing.xs,
    fontSize: 12,
    letterSpacing: 0.4,
    fontFamily: "Inter_500Medium",
    color: colors.textPrimary,
  },
});
