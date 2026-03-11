import React from "react";
import {
  FlatList,
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, textStyles } from "../../../src/theme";
import { useProductsQuery } from "../../../src/hooks/useProductsQuery";
import { AppHeader } from "../../../src/components/AppHeader";
import { ReelsSection } from "../../../src/components/ReelsSection";
import { Footer } from "../../../src/components/Footer";
import { ScrollToTopFab } from "../../../src/components/ScrollToTopFab";
import { CachedImage } from "../../../src/components/CachedImage";
import { HomeHeroBanner } from "../../../src/components/HomeHeroBanner";
import { FlowerHeartIcon } from "../../../src/components/FlowerHeartIcon";
import { SkeletonBlock } from "../../../src/components/Skeleton";
import { images } from "../../../src/data/images";
import { AppText as Text, ScreenContainer as SafeAreaView } from "../../../src/components";

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const spotlightQuery = useProductsQuery({ page: 1, limit: 8, sort: "newest" });

  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const listRef = React.useRef<FlatList<never> | null>(null);

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

  const spotlightFeature = spotlightCards[0];

  const listHeader = (
    <>
      <View style={styles.fullBleed}>
        <HomeHeroBanner onPress={() => deferNavigate("/marketplace")} />
      </View>

      <View style={styles.vibeSection}>
        <View style={styles.vibeHeadingWrap}>
          <FlowerHeartIcon size={38} color="#511d00" />
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
          <FlowerHeartIcon size={38} color="#511d00" />
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
          <FlowerHeartIcon size={38} color="#511d00" />
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
              <CachedImage source={spotlightFeature?.image ?? images.hero.mobile[2]} style={styles.spotlightImage} contentFit="cover" />
              <View style={styles.spotlightOverlay} />
              <View style={styles.spotlightActionWrap}>
                <Text style={styles.spotlightActionText}>EXPLORE NOW</Text>
              </View>
            </>
          )}
        </Pressable>
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
  );

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
        onScroll={(event) => {
          const shouldShow = event.nativeEvent.contentOffset.y > 260;
          if (shouldShow !== showScrollTop) setShowScrollTop(shouldShow);
        }}
        scrollEventThrottle={16}
      />

      <ScrollToTopFab
        visible={showScrollTop}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
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
    backgroundColor: "#C49A72",
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
    backgroundColor: "rgba(0, 0, 0, 0.14)",
  },
  spotlightActionWrap: {
    alignSelf: "center",
    marginBottom: spacing.lg,
    borderRadius: 999,
    backgroundColor: "#F9F7F2",
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
  },
  spotlightActionText: {
    color: "#221710",
    fontSize: 14,
    letterSpacing: 1.6,
    fontWeight: "700",
  },
});
