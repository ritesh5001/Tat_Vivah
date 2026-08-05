import * as React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { AppText as Text } from "./index";
import { Icon, type IconName } from "./Icon";
import { colors, radius, typography } from "../theme/tokens";
import { impactLight } from "../utils/haptics";
import { MotionPressable } from "./motion/MotionPressable";

type NavItem = {
  label: string;
  path: string;
  icon: IconName;
};

export const APP_BOTTOM_BAR_HEIGHT = 64;

export function getBottomBarTotalHeight(insetBottom: number): number {
  return APP_BOTTOM_BAR_HEIGHT + Math.max(insetBottom, 6);
}

const TAB_ROUTE_PREFIXES = [
  "/home",
  "/marketplace",
  "/reels",
  "/try-buy",
  "/search",
  "/profile",
  "/cart",
  "/wishlist",
  "/orders",
  "/notifications",
  "/categories",
  "/privacy-policy",
  "/return-policy",
  "/refund-policy",
  "/terms",
  "/contact",
];

const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/home", icon: "home" },
  { label: "Shop", path: "/marketplace", icon: "grid" },
  { label: "Reels", path: "/reels", icon: "play-circle-outline" },
  { label: "Profile", path: "/profile", icon: "user" },
];

function isTabRoute(pathname: string): boolean {
  return TAB_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Routes where the bottom bar should be hidden (focused flows with their own CTA). */
const HIDDEN_ROUTE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/request-otp",
  "/verify-otp",
  "/reset-password",
  "/product",
  "/checkout",
];

export function shouldHideBottomBar(pathname: string): boolean {
  if (isTabRoute(pathname)) return true;
  return HIDDEN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Weighted rather than snappy: the indicator should read as travelling, not cutting. */
const INDICATOR_SPRING = { damping: 18, stiffness: 170, mass: 0.85 } as const;

/**
 * One tab. Everything it animates is derived on the UI thread from the shared
 * `activeIndex`, so switching tabs costs no JavaScript beyond the route push.
 */
const BottomBarItem = React.memo(function BottomBarItem({
  item,
  index,
  activeIndex,
  onPress,
}: {
  item: NavItem;
  index: number;
  activeIndex: SharedValue<number>;
  onPress: (path: string) => void;
}) {
  /** 1 when this tab owns the indicator, falling off as it travels away. */
  const focus = useDerivedValue(() =>
    interpolate(Math.abs(activeIndex.value - index), [0, 1], [1, 0], "clamp")
  );

  // The icon rises out of the row and swells as the indicator arrives under it.
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -3 * focus.value },
      { scale: 1 + 0.12 * focus.value },
    ],
  }));

  // The label firms up rather than appearing: it is always legible, never a
  // flash of new content.
  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + 0.45 * focus.value,
    transform: [{ translateY: 1 - focus.value }],
  }));

  const handlePress = React.useCallback(() => {
    impactLight();
    onPress(item.path);
  }, [item.path, onPress]);

  return (
    <MotionPressable
      style={styles.item}
      onPress={handlePress}
      pressScale={0.94}
      haptic={false}
    >
      <Animated.View style={iconStyle}>
        <TabIcon item={item} focus={focus} />
      </Animated.View>
      <Animated.View style={labelStyle}>
        <TabLabel item={item} focus={focus} />
      </Animated.View>
    </MotionPressable>
  );
});

/**
 * Colour cannot be interpolated on the UI thread through the icon font, so the
 * tint crossfades two stacked copies instead — the gold one fades up as the
 * muted one fades out. Cheaper than it looks: both are already rasterised.
 */
function TabIcon({
  item,
  focus,
}: {
  item: NavItem;
  focus: SharedValue<number>;
}) {
  const mutedStyle = useAnimatedStyle(() => ({ opacity: 1 - focus.value }));
  const activeStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    ...StyleSheet.absoluteFillObject,
  }));

  return (
    <View>
      <Animated.View style={mutedStyle}>
        <Icon name={item.icon} size={21} color={colors.brownSoft} />
      </Animated.View>
      <Animated.View style={activeStyle}>
        <Icon name={item.icon} size={21} color={colors.gold} />
      </Animated.View>
    </View>
  );
}

function TabLabel({
  item,
  focus,
}: {
  item: NavItem;
  focus: SharedValue<number>;
}) {
  const mutedStyle = useAnimatedStyle(() => ({ opacity: 1 - focus.value }));
  const activeStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    ...StyleSheet.absoluteFillObject,
  }));

  return (
    <View>
      <Animated.View style={mutedStyle}>
        <Text style={styles.label}>{item.label}</Text>
      </Animated.View>
      <Animated.View style={activeStyle} pointerEvents="none">
        <Text style={[styles.label, styles.activeLabel]}>{item.label}</Text>
      </Animated.View>
    </View>
  );
}

export function GlobalBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const currentIndex = React.useMemo(() => {
    const found = NAV_ITEMS.findIndex(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
    );
    return found;
  }, [pathname]);

  // Held as a shared value so the indicator travels between tabs instead of
  // teleporting. Hooks run unconditionally — the visibility check happens after.
  const activeIndex = useDerivedValue(() =>
    withSpring(currentIndex < 0 ? -1 : currentIndex, INDICATOR_SPRING)
  );

  const itemWidth = windowWidth / NAV_ITEMS.length;
  const indicatorWidth = Math.min(itemWidth - 24, 76);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth,
    transform: [
      {
        translateX:
          activeIndex.value * itemWidth + (itemWidth - indicatorWidth) / 2,
      },
    ],
    // Nothing is selected on a non-tab route; the pill retreats rather than
    // parking under the wrong icon.
    opacity: withTiming(activeIndex.value < -0.5 ? 0 : 1, { duration: 160 }),
  }));

  const handlePress = React.useCallback(
    (path: string) => {
      router.push(path as never);
    },
    [router]
  );

  if (shouldHideBottomBar(pathname)) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 6),
          height: getBottomBarTotalHeight(insets.bottom),
        },
      ]}
    >
      {/* Travels between tabs on the UI thread. Behind the icons, so it reads as
          a surface the tab sits on rather than a badge stuck to it. */}
      <Animated.View style={[styles.indicator, indicatorStyle]} />

      {NAV_ITEMS.map((item, index) => (
        <BottomBarItem
          key={item.path}
          item={item}
          index={index}
          activeIndex={activeIndex}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: APP_BOTTOM_BAR_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(196, 167, 108, 0.3)",
    backgroundColor: colors.surfaceElevated,
    flexDirection: "row",
    shadowColor: colors.charcoal,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 12,
    elevation: 12,
  },
  indicator: {
    position: "absolute",
    top: 8,
    left: 0,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(196, 167, 108, 0.14)",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    fontFamily: typography.sans,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.brownSoft,
  },
  activeLabel: {
    fontFamily: typography.sansMedium,
    color: colors.gold,
  },
});
