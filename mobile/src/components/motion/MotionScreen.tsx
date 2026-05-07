import * as React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";
import { motionDuration } from "../../lib/motion.config";

type MotionScreenProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export const MotionScreen = React.memo(function MotionScreen({ children, style }: MotionScreenProps) {
  return (
    <Animated.View
      entering={FadeInDown
        .duration(motionDuration.normal)
        .easing(Easing.bezier(0.24, 1, 0.32, 1))}
      style={style}
    >
      {children}
    </Animated.View>
  );
});
