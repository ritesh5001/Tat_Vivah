import * as React from "react";
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { CachedImage } from "./CachedImage";
import { images } from "../data/images";
import { spacing, typography } from "../theme/tokens";
import { AppText as Text } from "./AppText";

interface HomeHeroBannerProps {
  onPress?: () => void;
}

type HeroSlide = {
  id: string;
  image: any;
  eyebrow: string;
  title: string;
  subtitle: string;
};

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "hero-1",
    image: images.hero.mobile[0],
    eyebrow: "TatVivah Signature",
    title: "Royal Ceremony Collection",
    subtitle: "Crafted fits and premium fabrics that photograph beautifully from every angle.",
  },
  {
    id: "hero-2",
    image: images.hero.mobile[1],
    eyebrow: "Made for Celebrations",
    title: "Wedding to Reception",
    subtitle: "One destination for sherwanis, Indo-western layers, and complete occasion styling.",
  },
  {
    id: "hero-3",
    image: images.hero.mobile[2],
    eyebrow: "Luxury Edit",
    title: "Refined Menswear Stories",
    subtitle: "Real craftsmanship, rich textures, and premium silhouettes curated for modern grooms.",
  },
  {
    id: "hero-4",
    image: images.hero.mobile[4],
    eyebrow: "TatVivah Exclusive",
    title: "The Grand Festive Drop",
    subtitle: "Statement looks with comfort-first tailoring so you can celebrate all day with confidence.",
  },
];

export function HomeHeroBanner({ onPress }: HomeHeroBannerProps) {
  const { width } = useWindowDimensions();
  const sliderRef = React.useRef<FlatList<HeroSlide> | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeIndexRef = React.useRef(0);

  React.useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % HERO_SLIDES.length;
      sliderRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true,
      });
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, 4200);

    return () => clearInterval(interval);
  }, [width]);

  return (
    <View style={styles.heroCard}>
      <FlatList
        ref={sliderRef}
        data={HERO_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable style={[styles.slide, { width }]} onPress={onPress}>
            <CachedImage source={item.image} style={styles.heroImage} contentFit="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </Pressable>
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
      />

      <View style={styles.paginationWrap}>
        {HERO_SLIDES.map((slide, index) => (
          <View
            key={slide.id}
            style={[styles.paginationDot, index === activeIndex && styles.paginationDotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    height: 368,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: "#1E1A17",
    justifyContent: "flex-end",
  },
  slide: {
    height: "100%",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 26, 23, 0.36)",
  },
  heroContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  eyebrow: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#F2E7D4",
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 18,
    lineHeight: 22,
    color: "#FFFBF2",
  },
  subtitle: {
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 15,
    color: "#F2E7D4",
  },
  paginationWrap: {
    position: "absolute",
    bottom: spacing.sm,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  paginationDotActive: {
    width: 20,
    borderRadius: 999,
    backgroundColor: "#E2B866",
  },
});
