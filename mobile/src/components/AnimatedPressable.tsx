/**
 * AnimatedPressable — a drop-in replacement for Pressable with a subtle
 * scale-down spring animation on press.  Uses the built-in Animated API
 * with useNativeDriver for 60 fps performance.
 *
 * Usage:
 *   <AnimatedPressable style={styles.btn} onPress={handleTap}>
 *     <Text>Add to cart</Text>
 *   </AnimatedPressable>
 */
import * as React from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { impactLight } from "../utils/haptics";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AnimatedPressableProps extends Omit<PressableProps, "style"> {
  /**
   * Static style (or array of styles). The pressed-state opacity callback
   * from Pressable is NOT supported — use this component for the spring
   * scale effect instead.
   */
  style?: StyleProp<ViewStyle>;
  /** Scale factor when pressed. Defaults to 0.96. */
  activeScale?: number;
  /** Fire a light haptic on press-in. Defaults to true. */
  haptic?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AnimatedPressable = React.memo(function AnimatedPressable({
  style,
  activeScale = 0.96,
  haptic = true,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: AnimatedPressableProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = React.useCallback(
    (e: any) => {
      Animated.spring(scaleAnim, {
        toValue: activeScale,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
      if (haptic) impactLight();
      onPressIn?.(e);
    },
    [scaleAnim, activeScale, haptic, onPressIn],
  );

  const handlePressOut = React.useCallback(
    (e: any) => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }).start();
      onPressOut?.(e);
    },
    [scaleAnim, onPressOut],
  );

  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        {...rest}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
});
