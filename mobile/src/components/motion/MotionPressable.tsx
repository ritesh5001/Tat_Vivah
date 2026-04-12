import * as React from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
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

  return (
    <Animated.View entering={entering}>
      <Animated.View style={animatedStyle}>
        <Pressable
          {...rest}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={style}
        >
          {children}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});
