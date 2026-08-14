import * as React from "react";
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import Animated, {
  interpolate,
  type SharedValue,
  ReduceMotion,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { AppText as Text } from "./AppText";
import { Icon, type IconName } from "./Icon";
import { colors, radius, typography } from "../theme/tokens";
import { impactLight } from "../utils/haptics";
import { MotionPressable } from "./motion/MotionPressable";

/**
 * The bottom bar the shopper actually sees.
 *
 * The tab routes render the navigator's own bar, not `GlobalBottomBar` — that
 * one only appears on the handful of routes outside the tab set. So the premium
 * treatment has to live here or it never shows up on Home, Shop, Reels or
 * Profile.
 *
 * The whole bar is driven by one shared value tracking `state.index`, so the
 * indicator travels between tabs on the UI thread and switching costs nothing in
 * JavaScript beyond the navigation itself.
 */

/** Only these appear in the bar; every other registered screen is `href: null`. */
const VISIBLE_TABS: { name: string; label: string; icon: IconName }[] = [
  { name: "home/index", label: "Home", icon: "home" },
  { name: "marketplace/index", label: "Shop", icon: "grid" },
  { name: "reels/index", label: "Reels", icon: "play-circle-outline" },
  { name: "profile", label: "Profile", icon: "user" },
];

/** Weighted rather than snappy: the pill should read as travelling, not cutting. */
const INDICATOR_SPRING = {
  damping: 18,
  stiffness: 170,
  mass: 0.85,
  reduceMotion: ReduceMotion.System,
} as const;

function TabGlyph({
  icon,
  focus,
}: {
  icon: IconName;
  focus: SharedValue<number>;
}) {
  // Colour cannot be interpolated through an icon font on the UI thread, so the
  // gold copy fades up over the muted one instead of being re-tinted.
  const mutedStyle = useAnimatedStyle(() => ({ opacity: 1 - focus.value }));
  const activeStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    ...StyleSheet.absoluteFillObject,
  }));

  return (
    <View>
      <Animated.View style={mutedStyle}>
        <Icon name={icon} size={21} color={colors.brownSoft} />
      </Animated.View>
      <Animated.View style={activeStyle} pointerEvents="none">
        <Icon name={icon} size={21} color={colors.gold} />
      </Animated.View>
    </View>
  );
}

function TabItem({
  label,
  icon,
  index,
  activeIndex,
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: {
  label: string;
  icon: IconName;
  index: number;
  activeIndex: SharedValue<number>;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}) {
  /** 1 when this tab owns the indicator, falling away as it travels off. */
  const focus = useDerivedValue(() =>
    interpolate(Math.abs(activeIndex.value - index), [0, 1], [1, 0], "clamp")
  );

  // The icon rises out of the row and swells as the pill arrives beneath it.
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -3 * focus.value },
      { scale: 1 + 0.12 * focus.value },
    ],
  }));

  const activeLabelStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    ...StyleSheet.absoluteFillObject,
  }));

  return (
    <MotionPressable
      style={styles.item}
      onPress={onPress}
      onLongPress={onLongPress}
      pressScale={0.94}
      haptic={false}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={`Switches to ${label}`}
      accessibilityState={{ selected: isFocused }}
      testID={testID}
    >
      <Animated.View style={iconStyle}>
        <TabGlyph icon={icon} focus={focus} />
      </Animated.View>
      {/* Keep the base label opaque; the accent copy can still fade in without
          sacrificing the inactive label's contrast. */}
      <View>
        <Text style={styles.label}>{label}</Text>
        <Animated.View style={activeLabelStyle} pointerEvents="none">
          <Text style={[styles.label, styles.activeLabel]}>{label}</Text>
        </Animated.View>
      </View>
    </MotionPressable>
  );
}

export function AnimatedTabBar({
  state,
  navigation,
  descriptors,
  insets,
}: BottomTabBarProps) {
  const { width: windowWidth } = useWindowDimensions();

  // Map the navigator's route index onto our visible subset. Hidden routes keep
  // the pill where it was rather than sending it off the end of the bar.
  const activeName = state.routes[state.index]?.name;
  const foundVisibleIndex = React.useMemo(
    () => VISIBLE_TABS.findIndex((tab) => tab.name === activeName),
    [activeName]
  );
  const lastVisibleIndexRef = React.useRef(
    foundVisibleIndex >= 0 ? foundVisibleIndex : 0
  );
  const visibleIndex =
    foundVisibleIndex >= 0 ? foundVisibleIndex : lastVisibleIndexRef.current;

  React.useEffect(() => {
    if (foundVisibleIndex >= 0) lastVisibleIndexRef.current = foundVisibleIndex;
  }, [foundVisibleIndex]);

  const activeIndex = useDerivedValue(() =>
    withSpring(visibleIndex, INDICATOR_SPRING)
  );

  const itemWidth = windowWidth / VISIBLE_TABS.length;
  const indicatorWidth = Math.min(itemWidth - 14, 84);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth,
    transform: [
      {
        translateX:
          activeIndex.value * itemWidth + (itemWidth - indicatorWidth) / 2,
      },
    ],
  }));

  const bottomPadding = Math.max(insets.bottom, 6);

  // Only the navigator's own bar reports its height, so replacing it would
  // leave `useBottomTabBarHeight()` on a stale default — and the cart's pinned
  // summary would sit partly underneath this bar. Report it ourselves.
  const onHeightChange = React.useContext(BottomTabBarHeightCallbackContext);
  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      onHeightChange?.(event.nativeEvent.layout.height);
    },
    [onHeightChange]
  );

  const handlePress = React.useCallback(
    (name: string, isFocused: boolean) => {
      impactLight();
      const route = state.routes.find((r) => r.name === name);
      if (!route) return;

      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    [navigation, state.routes]
  );

  const handleLongPress = React.useCallback(
    (name: string) => {
      const route = state.routes.find((item) => item.name === name);
      if (!route) return;
      navigation.emit({ type: "tabLongPress", target: route.key });
    },
    [navigation, state.routes]
  );

  return (
    <View
      onLayout={handleLayout}
      accessibilityRole="tablist"
      accessibilityLabel="Primary navigation"
      style={[
        styles.wrapper,
        { paddingBottom: bottomPadding, height: 64 + bottomPadding },
      ]}
    >
      {/* Behind the icons, so it reads as a surface the tab rests on rather
          than a badge stuck to it. */}
      <Animated.View style={[styles.indicator, indicatorStyle]} />

      {VISIBLE_TABS.map((tab, index) => {
        const route = state.routes.find((item) => item.name === tab.name);
        const options = route ? descriptors[route.key]?.options : undefined;
        // A hidden route may retain this tab's indicator position, but it is not
        // the focused route. Keeping those concepts separate also ensures the
        // retained tab remains a working way back to its screen.
        const isFocused = tab.name === activeName;
        return (
          <TabItem
            key={tab.name}
            label={tab.label}
            icon={tab.icon}
            index={index}
            activeIndex={activeIndex}
            isFocused={isFocused}
            accessibilityLabel={options?.tabBarAccessibilityLabel ?? tab.label}
            testID={options?.tabBarButtonTestID}
            onPress={() => handlePress(tab.name, isFocused)}
            onLongPress={() => handleLongPress(tab.name)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(183, 149, 108, 0.3)",
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.charcoal,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 12,
    elevation: 12,
  },
  indicator: {
    position: "absolute",
    top: 5,
    left: 0,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(128, 96, 61, 0.22)",
    backgroundColor: "rgba(128, 96, 61, 0.09)",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.55,
    textTransform: "uppercase",
    color: colors.brownSoft,
  },
  activeLabel: {
    color: colors.gold,
  },
});
