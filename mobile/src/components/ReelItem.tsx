import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
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
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <View style={[styles.container, { width, height }]}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen={false}
        nativeControls={false}
        contentFit="cover"
      />
      <View style={styles.overlay} />

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
    backgroundColor: "rgba(0, 0, 0, 0.24)",
  },
  sideActions: {
    position: "absolute",
    right: spacing.md,
    bottom: 150,
    gap: spacing.md,
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
    left: spacing.md,
    right: 92,
    bottom: spacing.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(183, 149, 108, 0.45)",
    borderRadius: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
  },
  shopButton: {
    alignSelf: "flex-start",
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
