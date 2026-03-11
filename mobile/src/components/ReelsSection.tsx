import React, { memo, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { CachedImage } from "./CachedImage";
import { colors, spacing, textStyles } from "../theme";

export type ReelItem = {
  id: string;
  title: string;
  thumbnailUrl: string;
  query: string;
};

type ReelsSectionProps = {
  reels?: ReelItem[];
  onPressReel?: (query: string) => void;
};

const DEFAULT_REELS: ReelItem[] = [
  {
    id: "reel-1",
    title: "WEDDING EDIT",
    thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
    query: "wedding",
  },
  {
    id: "reel-2",
    title: "RECEPTION LOOK",
    thumbnailUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
    query: "reception",
  },
  {
    id: "reel-3",
    title: "SANGEET FIT",
    thumbnailUrl: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=900&q=80",
    query: "sangeet",
  },
];

const ReelCard = memo(function ReelCard({
  item,
  onPress,
  cardWidth,
  cardHeight,
}: {
  item: ReelItem;
  onPress?: (query: string) => void;
  cardWidth: number;
  cardHeight: number;
}) {
  const playSize = Math.max(36, Math.round(cardWidth * 0.22));

  return (
    <Pressable style={[styles.reelCard, { width: cardWidth }]} onPress={() => onPress?.(item.query)}>
      <CachedImage source={item.thumbnailUrl} style={[styles.video, { width: cardWidth, height: cardHeight }]} />
      <View style={[styles.videoOverlay, { borderRadius: 15 }]} />
      <View
        style={[
          styles.playChip,
          {
            width: playSize,
            height: playSize,
            borderRadius: playSize / 2,
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

export function ReelsSection({ reels, onPressReel }: ReelsSectionProps) {
  const data = useMemo(() => reels ?? DEFAULT_REELS, [reels]);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(width * 0.42, 152), 176);
  const cardHeight = Math.round(cardWidth * 1.9);

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.listContent}
      showsHorizontalScrollIndicator={false}
    >
      {data.map((item) => (
        <ReelCard
          key={item.id}
          item={item}
          onPress={onPressReel}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  reelCard: {
    width: 180,
  },
  video: {
    borderRadius: 18,
    backgroundColor: colors.border,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
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
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: 0.4,
  },
});
