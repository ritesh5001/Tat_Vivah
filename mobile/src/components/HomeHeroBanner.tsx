import * as React from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import type { ScrollView as ScrollViewComponent } from "react-native";
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
    <View pointerEvents="none" style={styles.bannerWineFade}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="hero-wine-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0A0604" stopOpacity="0" />
            <Stop offset="40%" stopColor="#0A0604" stopOpacity="0.05" />
            <Stop offset="68%" stopColor="#1A0E08" stopOpacity="0.42" />
            <Stop offset="100%" stopColor="#0A0604" stopOpacity="0.85" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#hero-wine-fade)" />
      </Svg>
    </View>
  );
}

interface HeroSlideViewProps {
  slide: HeroSlide;
  index: number;
  scrollX: Animated.Value;
  bannerWidth: number;
  bannerHeight: number;
  onPress?: () => void;
}

function HeroSlideView({ slide, index, scrollX, bannerWidth, bannerHeight, onPress }: HeroSlideViewProps) {
  // Range covering the previous, current, and next page positions.
  const inputRange = [
    (index - 1) * bannerWidth,
    index * bannerWidth,
    (index + 1) * bannerWidth,
  ];

  // Subtle parallax — the image wrap is 30% wider than the slide and clipped by overflow:hidden,
  // so translating it within ±0.12W never exposes the slide background.
  const imageTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [bannerWidth * 0.12, 0, -bannerWidth * 0.12],
    extrapolate: "clamp",
  });

  // Ken Burns: image is slightly zoomed when active, smaller when off-screen.
  const imageScale = scrollX.interpolate({
    inputRange,
    outputRange: [1.04, 1.1, 1.04],
    extrapolate: "clamp",
  });

  // Text fades in only when the slide is centered.
  const textOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });

  // Text rises a few pixels as it enters, smoothing the transition.
  const textTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [24, 0, -24],
    extrapolate: "clamp",
  });

  // Wrap the image in a wider container so the parallax shift never reveals the dark backdrop.
  const overscan = bannerWidth * 0.15;

  return (
    <Pressable
      style={[styles.slide, { width: bannerWidth, height: bannerHeight }]}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.heroImageWrap,
          {
            left: -overscan,
            right: -overscan,
            transform: [{ translateX: imageTranslateX }, { scale: imageScale }],
          },
        ]}
      >
        <CachedImage source={slide.image} style={styles.heroImage} contentFit="cover" />
      </Animated.View>

      <View style={styles.heroOverlay} />
      <BannerWineFade />

      <Animated.View
        style={[
          styles.heroContent,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowMark} />
          <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>
    </Pressable>
  );
}

interface PaginationDotProps {
  index: number;
  scrollX: Animated.Value;
  bannerWidth: number;
}

function PaginationDot({ index, scrollX, bannerWidth }: PaginationDotProps) {
  const inputRange = [
    (index - 1) * bannerWidth,
    index * bannerWidth,
    (index + 1) * bannerWidth,
  ];

  const dotWidth = scrollX.interpolate({
    inputRange,
    outputRange: [8, 28, 8],
    extrapolate: "clamp",
  });

  const dotOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.38, 1, 0.38],
    extrapolate: "clamp",
  });

  // Active dot uses a warm gold color, inactive ones a soft ivory.
  const dotColor = scrollX.interpolate({
    inputRange,
    outputRange: ["rgba(255,255,255,0.55)", "#E2B866", "rgba(255,255,255,0.55)"],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.paginationDot,
        {
          width: dotWidth,
          opacity: dotOpacity,
          backgroundColor: dotColor as unknown as string,
        },
      ]}
    />
  );
}

export function HomeHeroBanner({ onPress }: HomeHeroBannerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [bannerWidth, setBannerWidth] = React.useState(windowWidth);

  // Hero is slightly taller than wide for a cinematic feel (1.18:1).
  const bannerHeight = Math.round(bannerWidth * 1.18);

  const scrollX = React.useRef(new Animated.Value(0)).current;
  const sliderRef = React.useRef<ScrollViewComponent | null>(null);

  const activeIndexRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);

  React.useEffect(() => {
    setBannerWidth(windowWidth);
  }, [windowWidth]);

  const updateActiveIndex = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!bannerWidth) return;
      const idx = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
      activeIndexRef.current = Math.max(0, Math.min(HERO_SLIDES.length - 1, idx));
    },
    [bannerWidth]
  );

  const handleScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateActiveIndex(event);
      isDraggingRef.current = false;
    },
    [updateActiveIndex]
  );

  // Auto-advance every ~5s. Pauses while user is dragging.
  React.useEffect(() => {
    if (!bannerWidth) return;
    const interval = setInterval(() => {
      if (isDraggingRef.current) return;
      const next = (activeIndexRef.current + 1) % HERO_SLIDES.length;
      sliderRef.current?.scrollTo({
        x: next * bannerWidth,
        animated: next !== 0,
      });
      activeIndexRef.current = next;
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerWidth]);

  const onScroll = React.useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: false, // backgroundColor interpolation needs JS driver
      }),
    [scrollX]
  );

  return (
    <View
      style={[styles.heroCard, { height: bannerHeight }]}
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        if (next > 0 && next !== bannerWidth) setBannerWidth(next);
      }}
    >
      <Animated.ScrollView
        ref={sliderRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="normal"
        snapToInterval={bannerWidth}
        snapToAlignment="start"
        disableIntervalMomentum={true}
        directionalLockEnabled
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          isDraggingRef.current = true;
        }}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {HERO_SLIDES.map((item, index) => (
          <HeroSlideView
            key={item.id}
            slide={item}
            index={index}
            scrollX={scrollX}
            bannerWidth={bannerWidth}
            bannerHeight={bannerHeight}
            onPress={onPress}
          />
        ))}
      </Animated.ScrollView>

      <View pointerEvents="none" style={styles.paginationWrap}>
        {HERO_SLIDES.map((slide, index) => (
          <PaginationDot
            key={slide.id}
            index={index}
            scrollX={scrollX}
            bannerWidth={bannerWidth}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#0A0604",
    justifyContent: "flex-end",
  },
  slide: {
    position: "relative",
    overflow: "hidden",
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 14, 10, 0.18)",
  },
  bannerWineFade: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 56,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  eyebrowMark: {
    width: 22,
    height: 1.5,
    backgroundColor: "#E2B866",
  },
  eyebrow: {
    fontFamily: typography.sansMedium,
    fontSize: 10.5,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "#E2B866",
    fontWeight: "700",
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 28,
    lineHeight: 32,
    color: "#FFFBF2",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: typography.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: "rgba(255, 251, 242, 0.86)",
    marginTop: 4,
    maxWidth: 360,
  },
  paginationWrap: {
    position: "absolute",
    bottom: 22,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  paginationDot: {
    height: 4,
    borderRadius: 2,
  },
});
