import * as React from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { Icon, type IconName } from "./Icon";
import { colors, typography } from "../theme/tokens";

/**
 * One tab in the bottom bar, shared by `AnimatedTabBar` (the tab navigator's
 * own bar) and `GlobalBottomBar` (the lookalike shown on routes outside the
 * tab group).
 *
 * The settle on selection — icon lifts and eases in gold, label crossfades —
 * runs on a single `Animated.Value` with `useNativeDriver: true`. That is RN's
 * own native-driver timing, not Reanimated: it hands the animation to the
 * platform compositor once and is done, rather than recomputing a shared value
 * every frame from a spring. A prior version drove this from a
 * `withSpring(state.index)` that every tab subscribed to; switching tabs then
 * meant four components recalculating a spring on the JS thread at the exact
 * moment the destination tab (a product grid or the video feed) was mounting,
 * which is what produced the dropped frames this design avoids. This version
 * touches only the tab whose focus actually changed, and never runs during a
 * scroll or a list re-render.
 */
export const TabBarItem = React.memo(function TabBarItem({
  label,
  icon,
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: {
  label: string;
  icon: IconName;
  isFocused: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel: string;
  testID?: string;
}) {
  const focus = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  // Skip the entrance animation on first paint — a tab that is already
  // selected when the bar mounts should not visibly "become" selected.
  const mounted = React.useRef(false);

  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    Animated.timing(focus, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isFocused, focus]);

  const iconStyle = {
    transform: [
      {
        translateY: focus.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -2],
        }),
      },
      {
        scale: focus.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        }),
      },
    ],
  };

  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={`Switches to ${label}`}
      accessibilityState={{ selected: isFocused }}
      testID={testID}
    >
      <Animated.View style={iconStyle}>
        <Icon name={icon} size={21} color={isFocused ? colors.gold : colors.brownSoft} />
      </Animated.View>
      <Animated.Text
        style={[
          styles.label,
          {
            color: isFocused ? colors.gold : colors.brownSoft,
            opacity: focus.interpolate({
              inputRange: [0, 1],
              outputRange: [0.85, 1],
            }),
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
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
  },
});
