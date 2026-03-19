import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { colors, spacing, textStyles } from "../theme";
import { AppText as Text } from "./AppText";
import { CachedImage } from "./CachedImage";

export type ReelFeedItem = {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
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
  tabBarHeight?: number;
  isActive: boolean;
  isMuted: boolean;
  shouldPreload: boolean;
  shouldKeepInMemory: boolean;
  liked: boolean;
  onToggleMute: () => void;
  onToggleLike: (id: string) => void;
  onShare: (item: ReelFeedItem) => void;
  onPressProduct?: (id: string) => void;
};

function ReelItemBase({
  item,
  width,
  height,
  tabBarHeight = 0,
  isActive,
  isMuted,
  shouldPreload: _shouldPreload,
  shouldKeepInMemory: _shouldKeepInMemory,
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
  const player = useVideoPlayer(item.videoUrl ? { uri: item.videoUrl } : null, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = isMuted;
  });
  const hasProductDetails = Boolean(item.productTitle || item.productId);
  const bottomOffset = Math.max(tabBarHeight, 0);
  const actionsBottom = bottomOffset + 144;
  const metaBottom = bottomOffset + spacing.sm;
  const detailHeading = hasProductDetails ? "Product Details" : "About Us";
  const detailTitle = hasProductDetails
    ? item.productTitle?.trim() || "TatVivah Selection"
    : "TatVivah Trends";
  const detailBody = hasProductDetails
    ? item.caption?.trim() || "Handpicked premium style from TatVivah."
    : item.aboutFallback?.trim() ||
      "TatVivah curates premium ethnic wear crafted for weddings, celebrations, and festive occasions across India.";

  React.useEffect(() => {
    overlayOpacity.value = withTiming(isActive ? 0.18 : 0.28, { duration: 220 });
  }, [isActive, overlayOpacity]);

  React.useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  React.useEffect(() => {
    if (isActive && !isHolding) {
      player.play();
      return;
    }
    player.pause();
  }, [isActive, isHolding, player]);

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
      onToggleLike(item.id);
      return;
    }

    lastTapRef.current = now;
    singleTapTimerRef.current = setTimeout(() => {
      onToggleMute();
      singleTapTimerRef.current = null;
    }, 260);
  }, [item.id, onToggleLike, onToggleMute]);

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
      {item.thumbnailUrl ? (
        <CachedImage source={item.thumbnailUrl} style={styles.videoPoster} contentFit="cover" />
      ) : null}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
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

      <View style={[styles.sideActions, { bottom: actionsBottom }]}>
        <Pressable style={styles.actionButton} onPress={() => onToggleLike(item.id)}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={20}
            color={liked ? colors.primaryAccent : "#FFFFFF"}
          />
          <Text style={styles.actionLabel}>{liked ? "Liked" : "Like"}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => onShare(item)}>
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

      {hasProductDetails && item.productId ? (
        <Pressable
            style={[styles.metaWrap, styles.productMetaWrap, { bottom: metaBottom }]}
          onPress={() => onPressProduct?.(item.productId as string)}
        >
            <View style={styles.productInfoCol}>
              <Text numberOfLines={2} style={styles.productTitleInline}>
                {detailTitle}
              </Text>
              <View style={styles.shopButtonInline}>
                <Text style={styles.shopButtonText}>SHOP NOW</Text>
              </View>
            </View>

            {item.thumbnailUrl ? (
              <CachedImage source={item.thumbnailUrl} style={styles.productThumb} contentFit="cover" />
            ) : (
              <View style={[styles.productThumb, styles.productThumbFallback]}>
                <Text style={styles.productThumbFallbackText}>No Image</Text>
              </View>
            )}
        </Pressable>
      ) : (
        <View style={[styles.metaWrap, { bottom: metaBottom }]}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.metaHeading}>{detailHeading}</Text>
          <Text numberOfLines={1} style={styles.metaTitle}>
            {detailTitle}
          </Text>
          <Text numberOfLines={3} style={styles.caption}>
            {detailBody}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    position: "relative",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  videoPoster: {
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
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(183, 149, 108, 0.45)",
    borderRadius: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 2,
    alignItems: "center",
  },
  productMetaWrap: {
    width: "84%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  productInfoCol: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: spacing.sm,
  },
  productTitleInline: {
    ...textStyles.bodyText,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  shopButtonInline: {
    borderWidth: 1,
    borderColor: colors.primaryAccent,
    backgroundColor: "rgba(183, 149, 108, 0.14)",
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  productThumb: {
    width: 78,
    height: 96,
    borderWidth: 1,
    borderColor: "rgba(183, 149, 108, 0.7)",
    backgroundColor: "#161616",
  },
  productThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  productThumbFallbackText: {
    color: "#D5C4B0",
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  username: {
    ...textStyles.bodyText,
    color: colors.primaryAccent,
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
    borderColor: colors.primaryAccent,
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

function areEqual(prev: ReelItemProps, next: ReelItemProps) {
  return (
    prev.item.id === next.item.id &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.isActive === next.isActive &&
    prev.isMuted === next.isMuted &&
    prev.shouldPreload === next.shouldPreload &&
    prev.shouldKeepInMemory === next.shouldKeepInMemory &&
    prev.liked === next.liked
  );
}

export const ReelItem = React.memo(ReelItemBase, areEqual);
