import * as React from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";
import { CachedImage } from "./CachedImage";
import { images } from "../data/images";
import { spacing, typography } from "../theme/tokens";
import { AppText as Text } from "./AppText";

type HomeHeroBannerProps = {
  onPress?: () => void;
};

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
    subtitle: "Layered and statement-ready pieces designed for every event of your big week.",
  },
  {
    id: "hero-3",
    image: images.hero.mobile[2],
    eyebrow: "Tailored With Precision",
    title: "Refined Menswear Stories",
    subtitle: "Real craftsmanship, rich textures, and premium silhouettes curated for modern grooms.",
  },
  {
    id: "hero-4",
    image: images.hero.mobile[3],
    eyebrow: "TatVivah Exclusive",
    title: "The Grand Festive Drop",
    subtitle: "Statement looks with comfort-first tailoring so you can celebrate all day with confidence.",
  },
];

function BannerWineFade() {
  return (
    <View style={styles.bannerWineFade}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="hero-wine-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#4A2515" stopOpacity="0" />
            <Stop offset="52%" stopColor="#4A2515" stopOpacity="0.06" />
            <Stop offset="76%" stopColor="#4A2515" stopOpacity="0.28" />
            <Stop offset="100%" stopColor="#4A2515" stopOpacity="0.72" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#hero-wine-fade)" />
      </Svg>
    </View>
  );
}

export function HomeHeroBanner({ onPress }: HomeHeroBannerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [bannerWidth, setBannerWidth] = React.useState(windowWidth);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const sliderRef = React.useRef<FlatList<HeroSlide> | null>(null);
  const activeIndexRef = React.useRef(0);

  React.useEffect(() => {
    setBannerWidth(windowWidth);
  }, [windowWidth]);

  React.useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const handleScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!bannerWidth) return;
      const index = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
      const bounded = Math.max(0, Math.min(HERO_SLIDES.length - 1, index));
      if (bounded !== activeIndexRef.current) {
        activeIndexRef.current = bounded;
        setActiveIndex(bounded);
      }
    },
    [bannerWidth]
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!bannerWidth) return;
      const nextIndex = (activeIndexRef.current + 1) % HERO_SLIDES.length;
      sliderRef.current?.scrollToOffset({
        offset: nextIndex * bannerWidth,
        animated: true,
      });
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, 4200);

    return () => clearInterval(interval);
  }, [bannerWidth]);

  return (
    <View
      style={[styles.heroCard, { height: bannerWidth }]}
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);
        if (nextWidth > 0 && nextWidth !== bannerWidth) {
          setBannerWidth(nextWidth);
        }
      }}
    >
      <FlatList
        ref={sliderRef}
        data={HERO_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        style={[styles.slider, { height: bannerWidth }]}
        contentContainerStyle={[styles.sliderContent, { height: bannerWidth }]}
        snapToInterval={bannerWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: bannerWidth,
          offset: bannerWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <Pressable style={[styles.slide, { width: bannerWidth, height: bannerWidth }]} onPress={onPress}>
            <CachedImage source={item.image} style={styles.heroImage} contentFit="cover" />
            <View style={styles.heroOverlay} />
            <BannerWineFade />
            <View style={styles.heroContent}>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </Pressable>
        )}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
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
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: "#F4EFE7",
    justifyContent: "flex-end",
  },
  slider: {
    width: "100%",
  },
  sliderContent: {
    width: "100%",
  },
  slide: {
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 26, 23, 0.16)",
  },
  bannerWineFade: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
    backgroundColor: "transparent",
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
    fontSize: 24,
    lineHeight: 28,
    color: "#FFFBF2",
  },
  subtitle: {
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
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
    borderRadius: 0,
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  paginationDotActive: {
    width: 20,
    borderRadius: 0,
    backgroundColor: "#E2B866",
  },
});
