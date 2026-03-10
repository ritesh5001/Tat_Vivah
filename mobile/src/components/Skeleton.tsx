import * as React from "react";
import { View, StyleSheet, Animated, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

// ---------------------------------------------------------------------------
// Pulse animation hook (shared across all skeleton instances)
// ---------------------------------------------------------------------------
function usePulse(): Animated.Value {
  const opacity = React.useRef(new Animated.Value(0.18)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.42,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.18,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

// ---------------------------------------------------------------------------
// Base skeleton block
// ---------------------------------------------------------------------------
interface SkeletonBlockProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBlock({
  width: w = "100%",
  height: h = 12,
  borderRadius: br = 6,
  style,
}: SkeletonBlockProps) {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: br,
          backgroundColor: colors.brown,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonProductCard — 2-column grid card (search screen)
// ---------------------------------------------------------------------------
export const SkeletonProductCard = React.memo(function SkeletonProductCard({
  width: w,
}: {
  width?: number;
}) {
  const opacity = usePulse();
  return (
    <View style={[styles.productCard, w != null && { width: w }]}>
      <Animated.View
        style={[styles.productImage, { opacity, backgroundColor: colors.brown }]}
      />
      <Animated.View
        style={[styles.line, { opacity, marginTop: spacing.sm }]}
      />
      <Animated.View
        style={[styles.lineShort, { opacity, marginTop: spacing.xs }]}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// SkeletonOrderRow — order list card
// ---------------------------------------------------------------------------
export const SkeletonOrderRow = React.memo(function SkeletonOrderRow() {
  const opacity = usePulse();
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Animated.View style={[styles.orderTitleLine, { opacity }]} />
        <Animated.View style={[styles.orderBadge, { opacity }]} />
      </View>
      <Animated.View
        style={[styles.lineShort, { opacity, marginTop: spacing.xs }]}
      />
      <Animated.View
        style={[styles.orderPriceLine, { opacity, marginTop: spacing.sm }]}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// SkeletonNotificationRow — notification list card
// ---------------------------------------------------------------------------
export const SkeletonNotificationRow = React.memo(
  function SkeletonNotificationRow() {
    const opacity = usePulse();
    return (
      <View style={styles.notifCard}>
        <Animated.View style={[styles.line, { opacity }]} />
        <Animated.View
          style={[styles.notifMessage, { opacity, marginTop: spacing.xs }]}
        />
        <Animated.View
          style={[styles.notifDate, { opacity, marginTop: spacing.sm }]}
        />
      </View>
    );
  }
);

// ---------------------------------------------------------------------------
// SkeletonCartRow — cart item card
// ---------------------------------------------------------------------------
export const SkeletonCartRow = React.memo(function SkeletonCartRow() {
  const opacity = usePulse();
  return (
    <View style={styles.cartCard}>
      <Animated.View style={[styles.line, { opacity }]} />
      <Animated.View
        style={[styles.lineShort, { opacity, marginTop: spacing.xs }]}
      />
      <Animated.View
        style={[styles.orderPriceLine, { opacity, marginTop: spacing.sm }]}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // Product card skeleton
  productCard: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  productImage: {
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.brown,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brown,
  },
  lineShort: {
    height: 12,
    width: "60%",
    borderRadius: 6,
    backgroundColor: colors.brown,
  },

  // Order card skeleton
  orderCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTitleLine: {
    height: 14,
    width: "50%",
    borderRadius: 6,
    backgroundColor: colors.brown,
  },
  orderBadge: {
    height: 10,
    width: 70,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  orderPriceLine: {
    height: 12,
    width: "30%",
    borderRadius: 6,
    backgroundColor: colors.brown,
  },

  // Notification card skeleton
  notifCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  notifMessage: {
    height: 12,
    width: "90%",
    borderRadius: 6,
    backgroundColor: colors.brown,
  },
  notifDate: {
    height: 10,
    width: "25%",
    borderRadius: 5,
    backgroundColor: colors.gold,
  },

  // Cart card skeleton
  cartCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});
