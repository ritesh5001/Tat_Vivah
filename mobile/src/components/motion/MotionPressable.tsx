import * as React from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { motionDuration, motionSpring, type MotionPreset } from "../../lib/motion.config";
import { impactLight } from "../../utils/haptics";

export interface MotionPressableProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  pressScale?: number;
  haptic?: boolean;
  preset?: MotionPreset;
  enterDelay?: number;
}

function getEntering(preset: MotionPreset, delay: number) {
  const easing = Easing.bezier(0.2, 0.0, 0.0, 1);
  const duration = motionDuration.normal;

  switch (preset) {
    case "scale":
      return ZoomIn.duration(duration).delay(delay).easing(easing);
    case "slideUp":
      return SlideInUp.duration(duration).delay(delay).easing(easing);
    case "slideDown":
      return SlideInDown.duration(duration).delay(delay).easing(easing);
    case "slideLeft":
      return SlideInLeft.duration(duration).delay(delay).easing(easing);
    case "slideRight":
      return SlideInRight.duration(duration).delay(delay).easing(easing);
    case "fade":
    default:
      return FadeIn.duration(duration).delay(delay).easing(easing);
  }
}

export const MotionPressable = React.memo(function MotionPressable({
  children,
  style,
  onPressIn,
  onPressOut,
  pressScale = 0.965,
  haptic = true,
  preset = "fade",
  enterDelay = 0,
  ...rest
}: MotionPressableProps) {
  const scale = useSharedValue(1);
  const entering = React.useMemo(() => getEntering(preset, enterDelay), [preset, enterDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: scale.value,
      },
    ],
  }));

  const handlePressIn = React.useCallback(
    (event: any) => {
      scale.value = withSpring(pressScale, motionSpring.soft);
      if (haptic) {
        impactLight();
      }
      onPressIn?.(event);
    },
    [haptic, onPressIn, pressScale, scale]
  );

  const handlePressOut = React.useCallback(
    (event: any) => {
      scale.value = withSpring(1, motionSpring.bouncy);
      onPressOut?.(event);
    },
    [onPressOut, scale]
  );

  // The two Animated.View wrappers sit between this component's parent and the
  // Pressable that carries `style`. Anything the PARENT lays out against — flex,
  // width, alignSelf — has to live on the outermost wrapper, or the wrapper
  // collapses to its content and the caller's sizing is silently ignored. That is
  // what squashed the bottom nav: four flex:1 items packed to the left.
  const outerLayoutStyle = React.useMemo(() => {
    const flat = StyleSheet.flatten(style) ?? {};
    const { flex, flexGrow, flexShrink, flexBasis, alignSelf, width, height } =
      flat as ViewStyle;
    return {
      ...(flex !== undefined ? { flex } : {}),
      ...(flexGrow !== undefined ? { flexGrow } : {}),
      ...(flexShrink !== undefined ? { flexShrink } : {}),
      ...(flexBasis !== undefined ? { flexBasis } : {}),
      ...(alignSelf !== undefined ? { alignSelf } : {}),
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
    } as ViewStyle;
  }, [style]);

  // Only stretch the inner layers when the caller actually asked to be sized by
  // its parent. Applying 100% inside a content-sized wrapper would collapse every
  // other MotionPressable in the app.
  const isStretched = Object.keys(outerLayoutStyle).length > 0;

  return (
    <Animated.View entering={entering} style={isStretched ? outerLayoutStyle : undefined}>
      <Animated.View style={[animatedStyle, isStretched && styles.fill]}>
        <Pressable
          {...rest}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[style, isStretched && styles.fill]}
        >
          {children}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  /** Let the inner layers fill whatever the outer wrapper was sized to. */
  fill: { width: "100%", height: "100%" },
});
