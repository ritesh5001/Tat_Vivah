import * as React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors, spacing } from "../theme/tokens";

interface BrandLoaderProps {
  size?: number;
  color?: string;
}

export function BrandLoader({ size = 10, color = colors.charcoal }: BrandLoaderProps) {
  const dots = React.useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  React.useEffect(() => {
    const animations = dots.map((dot) =>
      Animated.sequence([
        Animated.timing(dot, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0.3,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );

    const loop = Animated.loop(Animated.stagger(120, animations));
    loop.start();
    return () => loop.stop();
  }, [dots]);

  return (
    <View style={styles.row}>
      {dots.map((opacity, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: 0,
              backgroundColor: color,
              opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    backgroundColor: colors.charcoal,
  },
});
