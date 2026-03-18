import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { colors, spacing, textStyles } from "../theme";
import { AppText as Text } from "./AppText";

export type ReelFeedItem = {
  id: string;
  videoUrl: string;
  caption: string;
  username: string;
  productId: string | null;
  productTitle?: string | null;
  aboutFallback?: string;
};

type ReelItemProps = {
  item: ReelFeedItem;
  width: number;
  height: number;
  isActive: boolean;
  isMuted: boolean;
  liked: boolean;
  onToggleMute: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  onPressProduct?: () => void;
};

export const ReelItem = React.memo(function ReelItem({
  item,
  width,
  height,
  isActive,
  isMuted,
  liked,
  onToggleMute,
  onToggleLike,
  onShare,
  onPressProduct,
}: ReelItemProps) {
  const [isHolding, setIsHolding] = React.useState(false);
  const overlayOpacity = useSharedValue(0.24);
  const likeScale = useSharedValue(0.2);
  const likeOpacity = useSharedValue(0);
  const lastTapRef = React.useRef(0);
  const singleTapTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasProductDetails = Boolean(item.productTitle || item.productId);
  const detailHeading = hasProductDetails ? "Product Details" : "About Us";
  const detailTitle = hasProductDetails
    ? item.productTitle?.trim() || "TatVivah Selection"
    : "TatVivah Trends";
  const detailBody = hasProductDetails
    ? item.caption?.trim() || "Handpicked premium style from TatVivah."
    : item.aboutFallback?.trim() ||
      "TatVivah curates premium ethnic wear crafted for weddings, celebrations, and festive occasions across India.";

  const player = useVideoPlayer({ uri: item.videoUrl }, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = isMuted;
  });

  React.useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  React.useEffect(() => {
    if (isActive && !isHolding) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isHolding, player]);

  React.useEffect(() => {
    overlayOpacity.value = withTiming(isActive ? 0.18 : 0.28, { duration: 220 });
  }, [isActive, overlayOpacity]);

  React.useEffect(() => {
    if (!liked) return;
    likeOpacity.value = withTiming(1, { duration: 100 });
    likeScale.value = withSpring(1.12, { damping: 12, stiffness: 220, mass: 0.9 });

    const hide = setTimeout(() => {
      likeOpacity.value = withTiming(0, { duration: 200 });
      likeScale.value = withSpring(0.8, { damping: 16, stiffness: 180, mass: 0.9 });
    }, 180);

    return () => clearTimeout(hide);
  }, [liked, likeOpacity, likeScale]);

  React.useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  const handleVideoTap = React.useCallback(() => {
    const now = Date.now();

    if (now - lastTapRef.current < 260) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = 0;
      onToggleLike();
      return;
    }

    lastTapRef.current = now;
    singleTapTimerRef.current = setTimeout(() => {
      onToggleMute();
      singleTapTimerRef.current = null;
    }, 260);
  }, [onToggleLike, onToggleMute]);

  const handleLongPress = React.useCallback(() => {
    setIsHolding(true);
  }, []);

  const handlePressOut = React.useCallback(() => {
    setIsHolding(false);
  }, []);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: likeOpacity.value,
    transform: [{ scale: likeScale.value }],
  }));

  return (
    <View style={[styles.container, { width, height }]}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen={false}
        nativeControls={false}
        contentFit="cover"
      />
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={handleVideoTap}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        delayLongPress={180}
      >
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]} />
      </Pressable>

      <Animated.View pointerEvents="none" style={[styles.likeBurst, likeAnimatedStyle]}>
        <Ionicons name="heart" size={74} color="rgba(255, 255, 255, 0.95)" />
      </Animated.View>

      <View style={styles.sideActions}>
        <Pressable style={styles.actionButton} onPress={onToggleLike}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={20}
            color={liked ? colors.gold : "#FFFFFF"}
          />
          <Text style={styles.actionLabel}>{liked ? "Liked" : "Like"}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionLabel}>Share</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onToggleMute}>
          <Ionicons
            name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.actionLabel}>{isMuted ? "Muted" : "Sound"}</Text>
        </Pressable>
      </View>

      <View style={styles.metaWrap}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.metaHeading}>{detailHeading}</Text>
        <Text numberOfLines={1} style={styles.metaTitle}>
          {detailTitle}
        </Text>
        <Text numberOfLines={3} style={styles.caption}>
          {detailBody}
        </Text>
        {hasProductDetails && item.productId ? (
          <Pressable style={styles.shopButton} onPress={onPressProduct}>
            <Text style={styles.shopButtonText}>SHOP NOW</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    position: "relative",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  likeBurst: {
    position: "absolute",
    alignSelf: "center",
    top: "40%",
    zIndex: 4,
  },
  sideActions: {
    position: "absolute",
    right: spacing.md,
    bottom: 178,
    gap: spacing.md,
    zIndex: 3,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(183, 149, 108, 0.6)",
    borderRadius: 0,
    minWidth: 52,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  metaWrap: {
    position: "absolute",
    alignSelf: "center",
    width: "78%",
    bottom: spacing.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(183, 149, 108, 0.45)",
    borderRadius: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 2,
    alignItems: "center",
  },
  username: {
    ...textStyles.bodyText,
    color: colors.gold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  metaHeading: {
    color: "#E8D5BF",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaTitle: {
    ...textStyles.bodyText,
    color: "#FFFFFF",
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  caption: {
    ...textStyles.bodyText,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  shopButton: {
    alignSelf: "center",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "rgba(183, 149, 108, 0.14)",
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
