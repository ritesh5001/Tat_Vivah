import * as React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { MotiView, type MotiProps } from "moti";
import {
  getMotionPreset,
  motionDuration,
  motionEasing,
  type MotionPreset,
} from "../../lib/motion.config";

type MotionViewProps = React.PropsWithChildren<
  Omit<MotiProps<ViewStyle>, "from" | "animate" | "transition"> & {
    style?: StyleProp<ViewStyle>;
    preset?: MotionPreset;
    delay?: number;
    duration?: number;
  }
>;

export const MotionView = React.memo(function MotionView({
  children,
  style,
  preset = "fade",
  delay = 0,
  duration = motionDuration.normal,
  ...rest
}: MotionViewProps) {
  const presetStyles = React.useMemo(() => getMotionPreset(preset), [preset]);

  return (
    <MotiView
      from={presetStyles.from}
      animate={presetStyles.to}
      transition={{
        type: "timing",
        delay,
        duration,
        easing: motionEasing.standard,
      }}
      style={style}
      {...rest}
    >
      {children}
    </MotiView>
  );
});
