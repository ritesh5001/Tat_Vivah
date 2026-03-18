import * as React from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { MotiView } from "moti";
import { getMotionPreset, motionDuration, motionEasing, motionSpring, type MotionPreset } from "../../lib/motion.config";
import { impactLight } from "../../utils/haptics";

export interface MotionPressableProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  pressScale?: number;
  haptic?: boolean;
  preset?: MotionPreset;
  enterDelay?: number;
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
  const presetStyles = React.useMemo(() => getMotionPreset(preset), [preset]);

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
    <MotiView
      from={presetStyles.from}
      animate={presetStyles.to}
      transition={{
        type: "timing",
        delay: enterDelay,
        duration: motionDuration.normal,
        easing: motionEasing.standard,
      }}
    >
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
    </MotiView>
  );
});
