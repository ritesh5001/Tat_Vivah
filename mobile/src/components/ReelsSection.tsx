import React, { memo, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { ImageSource } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { createVideoPlayer, VideoView, useVideoPlayer } from "expo-video";
import { CachedImage } from "./CachedImage";
import { colors, spacing, textStyles } from "../theme";
import { listPublicReels, type PublicReel } from "../services/reels";

export type ReelItem = {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  query: string;
  needsGeneratedThumbnail: boolean;
};

type ReelsSectionProps = {
  enableFetch?: boolean;
  initialLimit?: number;
  onPressReel?: (query: string) => void;
};

type ThumbnailValue = ImageSource | string | number;

function toReelItem(reel: PublicReel): ReelItem {
  const query = reel.product?.title || reel.caption || "wedding";
  const title = reel.caption?.trim() || reel.product?.title || "TRENDING REEL";
  const thumbnailFromProduct = reel.product?.images?.[0] ?? "";

  return {
    id: reel.id,
    title: title.toUpperCase(),
    thumbnailUrl: reel.thumbnailUrl?.trim() || thumbnailFromProduct || "",
    videoUrl: reel.videoUrl,
    query,
    needsGeneratedThumbnail: !(reel.thumbnailUrl?.trim() || thumbnailFromProduct),
  };
}

const ReelCard = memo(function ReelCard({
  item,
  thumbnailOverride,
  thumbnailFailed,
  onPress,
  cardWidth,
  cardHeight,
}: {
  item: ReelItem;
  thumbnailOverride?: ThumbnailValue;
  thumbnailFailed?: boolean;
  onPress?: (item: ReelItem) => void;
  cardWidth: number;
  cardHeight: number;
}) {
  const playSize = Math.max(36, Math.round(cardWidth * 0.22));
  const resolvedThumbnail = thumbnailOverride || item.thumbnailUrl;

  return (
    <Pressable style={[styles.reelCard, { width: cardWidth }]} onPress={() => onPress?.(item)}>
      {resolvedThumbnail ? (
        <CachedImage source={resolvedThumbnail} style={[styles.video, { width: cardWidth, height: cardHeight }]} />
      ) : (
        <View style={[styles.videoPlaceholder, { width: cardWidth, height: cardHeight }]}>
          {!thumbnailFailed ? <ActivityIndicator color={colors.headerBrown} size="small" /> : null}
          <Text style={styles.placeholderText}>
            {thumbnailFailed ? "Preview unavailable" : "Preparing preview"}
          </Text>
        </View>
      )}
      <View style={styles.videoOverlay} />
      <View
        style={[
          styles.playChip,
          {
            width: playSize,
            height: playSize,
            borderRadius: 0,
            top: cardHeight / 2 - playSize / 2,
            left: cardWidth / 2 - playSize / 2,
          },
        ]}
      >
        <Text style={styles.playChipText}>▶</Text>
      </View>
      <Text numberOfLines={1} style={[textStyles.bodyText, styles.reelTitle]}>
        {item.title}
      </Text>
    </Pressable>
  );
});

export function ReelsSection({
  enableFetch = true,
  initialLimit = 6,
  onPressReel,
}: ReelsSectionProps) {
  const [activeReel, setActiveReel] = useState<ReelItem | null>(null);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Record<string, ThumbnailValue>>({});
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, true>>({});
  const player = useVideoPlayer(activeReel ? { uri: activeReel.videoUrl } : null, (videoPlayer) => {
    videoPlayer.loop = true;
  });

  const reelsQuery = useQuery({
    queryKey: ["home-reels", initialLimit],
    queryFn: () => listPublicReels({ page: 1, limit: initialLimit }),
    enabled: enableFetch,
    staleTime: 5 * 60 * 1000,
  });

  const data = useMemo(
    () => (reelsQuery.data?.reels ?? []).map(toReelItem),
    [reelsQuery.data]
  );

  const { width } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(width * 0.42, 152), 176);
  const cardHeight = Math.round(cardWidth * 1.9);

  const closeModal = () => setActiveReel(null);

  useEffect(() => {
    if (activeReel) {
      player.play();
      return;
    }
    player.pause();
  }, [activeReel, player]);

  useEffect(() => {
    if (!enableFetch || data.length === 0) return;

    let cancelled = false;

    const createMissingThumbnails = async () => {
      const updates: Record<string, ThumbnailValue> = {};
      const failed: Record<string, true> = {};

      for (const item of data) {
        if (
          !item.needsGeneratedThumbnail ||
          generatedThumbnails[item.id] ||
          failedThumbnails[item.id]
        ) {
          continue;
        }

        const thumbnailPlayer = createVideoPlayer({ uri: item.videoUrl });
        try {
          await thumbnailPlayer.replaceAsync({ uri: item.videoUrl });
          const thumbs = await thumbnailPlayer.generateThumbnailsAsync([1.0], {
            maxWidth: 360,
          });
          const thumbnail = thumbs?.[0];
          if (thumbnail) {
            updates[item.id] = thumbnail as unknown as ThumbnailValue;
          } else {
            failed[item.id] = true;
          }
        } catch {
          failed[item.id] = true;
        } finally {
          try {
            thumbnailPlayer.release();
          } catch {
            // ignore release failures
          }
        }
      }

      if (!cancelled && Object.keys(updates).length > 0) {
        setGeneratedThumbnails((prev) => ({ ...prev, ...updates }));
      }

      if (!cancelled && Object.keys(failed).length > 0) {
        setFailedThumbnails((prev) => ({ ...prev, ...failed }));
      }
    };

    void createMissingThumbnails();

    return () => {
      cancelled = true;
    };
  }, [data, enableFetch, failedThumbnails, generatedThumbnails]);

  if (!enableFetch || reelsQuery.isLoading) {
    return (
      <View style={styles.loadingRow}>
        <View style={[styles.loadingCard, { width: cardWidth, height: cardHeight }]} />
        <View style={[styles.loadingCard, { width: cardWidth, height: cardHeight }]} />
        <View style={[styles.loadingCard, { width: cardWidth, height: cardHeight }]} />
      </View>
    );
  }

  if (reelsQuery.isError || data.length === 0) {
    return (
      <View style={styles.emptyStateWrap}>
        <Text style={styles.emptyStateText}>No reels available right now.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        horizontal
        contentContainerStyle={styles.listContent}
        showsHorizontalScrollIndicator={false}
      >
        {data.map((item) => (
          <ReelCard
            key={item.id}
            item={item}
            thumbnailOverride={generatedThumbnails[item.id]}
            thumbnailFailed={Boolean(failedThumbnails[item.id])}
            onPress={setActiveReel}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
        ))}
      </ScrollView>

      <Modal
        visible={Boolean(activeReel)}
        animationType="fade"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Pressable style={styles.modalCloseButton} onPress={closeModal}>
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </Pressable>

            {activeReel ? (
              <>
                <VideoView
                  player={player}
                  style={styles.modalVideo}
                  nativeControls
                  contentFit="cover"
                />
                <Text numberOfLines={1} style={styles.modalTitle}>
                  {activeReel.title}
                </Text>
                <Pressable
                  style={styles.modalActionButton}
                  onPress={() => {
                    closeModal();
                    onPressReel?.(activeReel.query);
                  }}
                >
                  <Text style={styles.modalActionText}>SHOP THIS STYLE</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.modalLoaderWrap}>
                <ActivityIndicator color={colors.headerBrown} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  loadingCard: {
    backgroundColor: "#E3D8CB",
    borderWidth: 1.5,
    borderColor: "#7B4C2C",
  },
  emptyStateWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  listContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  reelCard: {
    width: 180,
  },
  video: {
    borderRadius: 0,
    backgroundColor: colors.border,
    borderWidth: 1.5,
    borderColor: "#7B4C2C",
  },
  videoPlaceholder: {
    borderRadius: 0,
    borderWidth: 1.5,
    borderColor: "#7B4C2C",
    backgroundColor: "#E7DDCF",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    backgroundColor: "rgba(0,0,0,0.26)",
  },
  playChip: {
    position: "absolute",
    backgroundColor: "rgba(253, 248, 240, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  playChipText: {
    color: colors.headerBrown,
    fontSize: 16,
    marginLeft: 2,
  },
  reelTitle: {
    marginTop: spacing.sm,
    backgroundColor:"#b7956c",
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "center",
    paddingHorizontal: spacing.pageHorizontal,
  },
  modalCard: {
    backgroundColor: "#FCF6EA",
    borderWidth: 1.5,
    borderColor: "#7B4C2C",
    padding: spacing.md,
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#7B4C2C",
  },
  modalCloseText: {
    color: colors.headerBrown,
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: "Inter_600SemiBold",
  },
  modalVideo: {
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: "#1D1A17",
    marginTop: spacing.sm,
  },
  modalTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: 0.4,
    ...textStyles.bodyText,
  },
  modalActionButton: {
    alignSelf: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: "#7B4C2C",
    backgroundColor: "#B08A3E",
  },
  modalActionText: {
    color: "#b7956c",
    letterSpacing: 1,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  modalLoaderWrap: {
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
  },
});
