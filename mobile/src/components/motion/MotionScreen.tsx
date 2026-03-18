import * as React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { MotiView } from "moti";
import { motionDuration, motionEasing } from "../../lib/motion.config";

type MotionScreenProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export const MotionScreen = React.memo(function MotionScreen({ children, style }: MotionScreenProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: "timing",
        duration: motionDuration.normal,
        easing: motionEasing.smooth,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
});
