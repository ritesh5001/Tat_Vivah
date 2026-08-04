import * as React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors, spacing, typography } from "../theme/tokens";
import { impactLight, impactMedium } from "../utils/haptics";
import { AppText as Text } from "./index";

/**
 * Drag the handle either way to act. The gesture is the primary action.
 *
 * Motion is tuned for weight rather than speed: a low-stiffness spring with real
 * mass, so the handle reads as an object being moved rather than a value being
 * set. Everything else — chevrons, labels, glow, tilt — is derived from a single
 * signed progress value, which keeps the whole bar in sync on the UI thread.
 */
const HANDLE_SIZE = 58;
const TRACK_PADDING = 5;
/** Fraction of travel that commits. */
const COMMIT_RATIO = 0.55;
/** Where anticipation begins — the lift, swell and glow. */
const ANTICIPATION_RATIO = 0.6;
/** Weighted and slightly under-damped: a physical object, not a toggle. */
const HANDLE_SPRING = { damping: 15, stiffness: 130, mass: 0.9 } as const;
/** Matches the flight duration so the icon is back before it is needed again. */
const ICON_RESTORE_MS = 760;

export type SwipeDirection = "left" | "right";
export interface SwipeOrigin {
  x: number;
  y: number;
}

export function SwipeActionBar({
  onSwipeLeft,
  onSwipeRight,
  leftLabel = "Add to Bag",
  rightLabel = "Buy Now",
  disabled = false,
}: {
  /** Receives the handle's centre within the bar, for a detaching flight. */
  onSwipeLeft: (origin: SwipeOrigin) => void;
  onSwipeRight: (origin: SwipeOrigin) => void;
  leftLabel?: string;
  rightLabel?: string;
  disabled?: boolean;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const trackWidth = Math.max(windowWidth - spacing.md * 2, 260);
  const maxTravel = (trackWidth - HANDLE_SIZE) / 2 - TRACK_PADDING;

  const translateX = useSharedValue(0);
  /** Compression on commit, independent of travel. */
  const compress = useSharedValue(1);
  /** 0 while the icon rides the handle, 1 once detached for its flight. */
  const iconDetached = useSharedValue(0);

  /** Signed −1…1 travel — the basis for every derived visual. */
  const progress = useDerivedValue(() =>
    maxTravel === 0 ? 0 : translateX.value / maxTravel
  );

  const layoutRef = React.useRef({ x: 0, y: 0 });
  const restoreTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    },
    []
  );

  const fire = React.useCallback(
    (direction: SwipeDirection) => {
      impactMedium();
      const origin = layoutRef.current;
      if (direction === "left") onSwipeLeft(origin);
      else onSwipeRight(origin);
    },
    [onSwipeLeft, onSwipeRight]
  );

  const tick = React.useCallback(() => impactLight(), []);

  /** Hide the icon while its copy is in flight, then fade it back. */
  const detachIcon = React.useCallback(() => {
    iconDetached.value = withTiming(1, { duration: 80 });
    if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    restoreTimerRef.current = setTimeout(() => {
      iconDetached.value = withTiming(0, { duration: 260 });
    }, ICON_RESTORE_MS);
  }, [iconDetached]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-6, 6])
    .onBegin(() => {
      runOnJS(tick)();
    })
    .onUpdate((event) => {
      // Past the ends it still moves, but reluctantly — the resistance is what
      // communicates that this is the edge without hard-stopping the finger.
      const raw = event.translationX;
      const over = Math.abs(raw) - maxTravel;
      translateX.value =
        over > 0 ? Math.sign(raw) * (maxTravel + over * 0.18) : raw;
    })
    .onEnd(() => {
      const committed = Math.abs(progress.value) > COMMIT_RATIO;
      const direction: SwipeDirection = translateX.value < 0 ? "left" : "right";

      if (committed) {
        // The circle compresses and stays put; only the icon travels.
        compress.value = withTiming(0.9, { duration: 110 }, () => {
          compress.value = withSpring(1, HANDLE_SPRING);
        });
        translateX.value = withSpring(0, HANDLE_SPRING);
        runOnJS(fire)(direction);
        runOnJS(detachIcon)();
        return;
      }

      translateX.value = withSpring(0, HANDLE_SPRING);
    });

  const handleStyle = useAnimatedStyle(() => {
    const magnitude = Math.abs(progress.value);
    const anticipation = interpolate(
      magnitude,
      [ANTICIPATION_RATIO, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: -4 * anticipation },
        { scale: compress.value * (1 + 0.08 * anticipation) },
      ],
      // The shadow deepens with travel: the object lifts off the track.
      shadowOpacity: 0.18 + 0.16 * magnitude,
      shadowRadius: 10 + 10 * magnitude,
      elevation: 6 + 6 * magnitude,
    };
  });

  /** Tilts into the direction of travel, then rides away on commit. */
  const iconStyle = useAnimatedStyle(() => ({
    opacity: 1 - iconDetached.value,
    transform: [
      { rotate: `${interpolate(progress.value, [-1, 1], [-14, 14])}deg` },
      { scale: 1 - 0.2 * iconDetached.value },
    ],
  }));

  /** A halo that only reads once the action has become inevitable. */
  const glowStyle = useAnimatedStyle(() => {
    const magnitude = Math.abs(progress.value);
    return {
      opacity: interpolate(
        magnitude,
        [ANTICIPATION_RATIO, 1],
        [0, 0.45],
        Extrapolation.CLAMP
      ),
      transform: [
        { translateX: translateX.value },
        {
          scale: interpolate(
            magnitude,
            [ANTICIPATION_RATIO, 1],
            [0.85, 1.3],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const leftLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [-1, 0], [1, 0.45], Extrapolation.CLAMP),
  }));
  const rightLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.45, 1], Extrapolation.CLAMP),
  }));

  /**
   * Chevrons light one at a time as the drag advances.
   *
   * Built once from a fixed-length array so the hook order never changes —
   * calling useAnimatedStyle inside a render callback would break the rules of
   * hooks the moment the count varied.
   */
  const leftChevrons = [0, 1, 2].map((index) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => {
      const magnitude = Math.max(0, -progress.value);
      const threshold = 0.18 + index * 0.16;
      return {
        opacity: interpolate(
          magnitude,
          [threshold, threshold + 0.18],
          [0.2, 1],
          Extrapolation.CLAMP
        ),
      };
    })
  );

  const rightChevrons = [0, 1, 2].map((index) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => {
      const magnitude = Math.max(0, progress.value);
      const threshold = 0.18 + index * 0.16;
      return {
        opacity: interpolate(
          magnitude,
          [threshold, threshold + 0.18],
          [0.2, 1],
          Extrapolation.CLAMP
        ),
      };
    })
  );

  const trackStyle = useAnimatedStyle(() => ({
    borderColor:
      Math.abs(progress.value) > COMMIT_RATIO ? colors.gold : colors.borderSoft,
    // Buy Now stretches the bar fractionally — momentum toward purchase.
    transform: [{ scaleX: 1 + Math.max(0, progress.value) * 0.02 }],
  }));

  return (
    <Animated.View
      style={[styles.track, { width: trackWidth }, trackStyle]}
      onLayout={(event) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        layoutRef.current = { x: x + width / 2, y: y + height / 2 };
      }}
    >
      <Animated.View style={[styles.labelWrap, leftLabelStyle]}>
        {leftChevrons.map((style, index) => (
          <Animated.View key={`l${index}`} style={style}>
            <Ionicons name="chevron-back" size={12} color={colors.brownSoft} />
          </Animated.View>
        ))}
        <Text style={styles.label} numberOfLines={1}>
          {leftLabel}
        </Text>
      </Animated.View>

      <Animated.View
        style={[styles.labelWrap, styles.labelWrapRight, rightLabelStyle]}
      >
        <Text style={styles.label} numberOfLines={1}>
          {rightLabel}
        </Text>
        {rightChevrons.map((style, index) => (
          <Animated.View key={`r${index}`} style={style}>
            <Ionicons name="chevron-forward" size={12} color={colors.brownSoft} />
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />

      {/* Rendered last so it stays the touch target above the label rows. */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.handle, handleStyle, disabled && styles.handleDisabled]}
        >
          <Animated.View style={iconStyle}>
            <Ionicons name="bag-handle" size={22} color={colors.warmWhite} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    alignSelf: "center",
    height: HANDLE_SIZE + TRACK_PADDING * 2,
    borderRadius: (HANDLE_SIZE + TRACK_PADDING * 2) / 2,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.cream,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  labelWrapRight: { justifyContent: "flex-end" },
  label: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.charcoal,
    marginHorizontal: 4,
  },
  glow: {
    position: "absolute",
    zIndex: 1,
    top: TRACK_PADDING - 6,
    left: "50%",
    marginLeft: -(HANDLE_SIZE + 12) / 2,
    width: HANDLE_SIZE + 12,
    height: HANDLE_SIZE + 12,
    borderRadius: (HANDLE_SIZE + 12) / 2,
    backgroundColor: colors.gold,
  },
  handle: {
    position: "absolute",
    zIndex: 2,
    top: TRACK_PADDING,
    left: "50%",
    marginLeft: -HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: colors.charcoal,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gold,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 5 },
  },
  handleDisabled: { opacity: 0.45 },
});
