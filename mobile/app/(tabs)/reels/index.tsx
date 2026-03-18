import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createVideoPlayer } from "expo-video";
import { AppText as Text } from "../../../src/components";
import { MotionView } from "../../../src/components/motion";
import { ReelItem, type ReelFeedItem } from "../../../src/components/ReelItem";
import { companyInfo } from "../../../src/data/company";
import { listPublicReels } from "../../../src/services/reels";
import { impactLight } from "../../../src/utils/haptics";
import { colors, spacing } from "../../../src/theme";

const REELS_PAGE_LIMIT = 8;
const ABOUT_US_FALLBACK = `${companyInfo.brand} curates premium ethnic wear for weddings and celebrations, combining heritage craftsmanship with modern comfort.`;

export default function ReelsScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [visibleIndex, setVisibleIndex] = React.useState(0);
  const [likedById, setLikedById] = React.useState<Record<string, boolean>>({});
  const [isMuted, setIsMuted] = React.useState(false);
  const preloadedRef = React.useRef<Set<string>>(new Set());

  const reelsQuery = useInfiniteQuery({
    queryKey: ["reels-feed", REELS_PAGE_LIMIT],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listPublicReels({ page: pageParam, limit: REELS_PAGE_LIMIT }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
  });

  const reels = React.useMemo<ReelFeedItem[]>(() => {
    const pages = reelsQuery.data?.pages ?? [];
    return pages.flatMap((page) =>
      (page.reels ?? []).map((reel) => ({
        id: reel.id,
        videoUrl: reel.videoUrl,
        caption: reel.caption?.trim() || "",
        username: "@tatvivah",
        productId: reel.productId ?? null,
        productTitle: reel.product?.title?.trim() || null,
        aboutFallback: ABOUT_US_FALLBACK,
      }))
    );
  }, [reelsQuery.data]);

  const itemHeight = height;
  const itemWidth = width;

  const viewabilityConfigRef = React.useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 120,
  });

  const onViewableItemsChanged = React.useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    const firstVisible = viewableItems.find((entry) => typeof entry.index === "number");
    if (typeof firstVisible?.index === "number") {
      setVisibleIndex((prev) => (prev === firstVisible.index ? prev : firstVisible.index));
    }
  }).current;

  const loadMore = React.useCallback(() => {
    if (reelsQuery.hasNextPage && !reelsQuery.isFetchingNextPage) {
      void reelsQuery.fetchNextPage();
    }
  }, [reelsQuery]);

  const toggleLike = React.useCallback((id: string) => {
    impactLight();
    setLikedById((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleMute = React.useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const shareReel = React.useCallback(async (item: ReelFeedItem) => {
    try {
      const shareTitle = item.productTitle?.trim() || item.caption?.trim() || "TatVivah reel";
      await Share.share({
        message: `${shareTitle}\n${item.videoUrl}`,
      });
    } catch {
      // no-op for canceled shares
    }
  }, []);

  React.useEffect(() => {
    if (reels.length === 0) return;

    const nextCandidates = reels.slice(visibleIndex + 1, visibleIndex + 3);
    let cancelled = false;

    const preload = async () => {
      for (const reel of nextCandidates) {
        if (!reel || preloadedRef.current.has(reel.id)) continue;
        preloadedRef.current.add(reel.id);

        const preloadPlayer = createVideoPlayer({ uri: reel.videoUrl });
        try {
          await preloadPlayer.replaceAsync({ uri: reel.videoUrl });
          preloadPlayer.pause();
        } catch {
          // Ignore preload failures; playback still works when user reaches item.
        } finally {
          try {
            preloadPlayer.release();
          } catch {
            // ignore release errors
          }
        }

        if (cancelled) return;
      }
    };

    void preload();

    return () => {
      cancelled = true;
    };
  }, [reels, visibleIndex]);

  const renderReel = React.useCallback(
    ({ item, index }: { item: ReelFeedItem; index: number }) => (
      <MotionView preset="slideUp" delay={Math.min(index * 20, 140)}>
        <ReelItem
          item={item}
          width={itemWidth}
          height={itemHeight}
          isActive={index === visibleIndex}
          isMuted={isMuted}
          liked={likedById[item.id] ?? false}
          onToggleMute={toggleMute}
          onToggleLike={() => toggleLike(item.id)}
          onShare={() => void shareReel(item)}
          onPressProduct={
            item.productId
              ? () => router.push(`/product/${item.productId}` as any)
              : undefined
          }
        />
      </MotionView>
    ),
    [isMuted, itemHeight, itemWidth, likedById, router, shareReel, toggleLike, toggleMute, visibleIndex]
  );

  if (reelsQuery.isLoading) {
    return (
      <View style={styles.stateWrap}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.stateText}>Loading reels...</Text>
      </View>
    );
  }

  if (reelsQuery.isError || reels.length === 0) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateText}>No reels available right now.</Text>
        <Pressable style={styles.retryButton} onPress={() => reelsQuery.refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={renderReel}
        pagingEnabled
        snapToAlignment="start"
        snapToInterval={itemHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfigRef.current}
        onEndReached={loadMore}
        onEndReachedThreshold={0.65}
        ListFooterComponent={
          reelsQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  stateWrap: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  stateText: {
    color: "#FFFFFF",
    fontSize: 13,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  retryButton: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(183, 149, 108, 0.15)",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  footerLoader: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
});
