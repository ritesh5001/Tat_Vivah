import * as React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors, typography, spacing } from "../theme/tokens";

// ---------------------------------------------------------------------------
// OfflineBanner — shows a subtle top banner when the device is offline
// ---------------------------------------------------------------------------
export function OfflineBanner({ visible }: { visible: boolean }) {
  const translateY = React.useRef(new Animated.Value(-48)).current;

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -48,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  // Keep component mounted for animation; transparency when hidden
  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY }] }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Text style={styles.text}>You are offline</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: colors.charcoal,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: spacing.xs,
    zIndex: 9999,
  },
  text: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.warmWhite,
    textTransform: "uppercase",
  },
});
