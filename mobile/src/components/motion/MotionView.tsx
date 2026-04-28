import * as React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  ZoomIn,
} from "react-native-reanimated";
import {
  motionDuration,
  type MotionPreset,
} from "../../lib/motion.config";

type MotionViewProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  preset?: MotionPreset;
  delay?: number;
  duration?: number;
}>;

function getEntering(preset: MotionPreset, delay: number, duration: number) {
  const easing = Easing.bezier(0.2, 0.0, 0.0, 1);

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

export const MotionView = React.memo(function MotionView({
  children,
  style,
  preset = "fade",
  delay = 0,
  duration = motionDuration.normal,
  ...rest
}: MotionViewProps) {
  const entering = React.useMemo(
    () => getEntering(preset, delay, duration),
    [preset, delay, duration]
  );

  return (
    <Animated.View entering={entering} style={style} {...rest}>
      {children}
    </Animated.View>
  );
});
