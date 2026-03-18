import * as React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  Alert,
  Modal,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "../../../src/components/CompatImage";
import * as ImagePicker from "expo-image-picker";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import {
  getProductById,
  type ProductDetail,
  type ProductSummary,
  type ProductVariant,
} from "../../../src/services/products";
import { getRelatedProductsFromApi } from "../../../src/services/search";
import { trackRecentlyViewed } from "../../../src/services/personalization";
import {
  fetchProductReviews,
  submitProductReview,
  type Review,
} from "../../../src/services/reviews";
import { useAuth } from "../../../src/hooks/useAuth";
import { useCart } from "@/src/providers/CartProvider";
import { useWishlist } from "@/src/providers/WishlistProvider";
import { useNetworkStatus } from "../../../src/hooks/useNetworkStatus";
import { useToast } from "../../../src/providers/ToastProvider";
import { ApiError, isAbortError } from "../../../src/services/api";
import { SkeletonBlock } from "../../../src/components/Skeleton";
import {
  AppInput as TextInput,
  AppText as Text,
  ScreenContainer as SafeAreaView,
} from "../../../src/components";
import { TatvivahLoader } from "../../../src/components/TatvivahLoader";
import { AnimatedPressable } from "../../../src/components/AnimatedPressable";
import { impactMedium, impactLight, notifySuccess } from "../../../src/utils/haptics";
import { AppHeader } from "../../../src/components/AppHeader";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  buildReviewImageName,
  uploadReviewImage,
  type ReviewImageAsset,
} from "../../../src/services/imagekit";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const IMAGE_HEIGHT = Math.round(IMAGE_WIDTH * 1.25);

const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const MAX_REVIEW_IMAGES = 3;
const MAX_REVIEW_IMAGE_BYTES = 2 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Memoised sub-components (extracted from render for FlatList perf)
// ---------------------------------------------------------------------------

/** Single gallery image with full-width paging. */
const GalleryImage = React.memo(function GalleryImage({
  uri,
}: {
  uri: string;
}) {
  return (
    <Image
      source={{ uri }}
      style={galleryStyles.image}
      contentFit="contain"
      transition={200}
      cachePolicy="memory-disk"
    />
  );
});

const galleryStyles = StyleSheet.create({
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 0,
    backgroundColor: colors.cream,
  },
});

const ZoomableModalImage = React.memo(function ZoomableModalImage({
  uri,
  onRequestClose,
}: {
  uri: string;
  onRequestClose: () => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const next = savedScale.value * event.scale;
      scale.value = Math.max(1, Math.min(4, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (savedScale.value < 1.02) {
        savedScale.value = 1;
        scale.value = withSpring(1);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const nextScale = savedScale.value > 1.4 ? 1 : 2.5;
      savedScale.value = nextScale;
      scale.value = withSpring(nextScale);

      if (nextScale === 1) {
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (savedScale.value > 1.02) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      } else {
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      if (savedScale.value <= 1.02 && Math.abs(translateY.value) > 120) {
        runOnJS(onRequestClose)();
        return;
      }

      if (savedScale.value > 1.02) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const composedGesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={viewerStyles.itemWrap}>
        <Animated.Image
          source={{ uri }}
          style={[viewerStyles.image, animatedStyle]}
          resizeMode="contain"
        />
      </View>
    </GestureDetector>
  );
});

const viewerStyles = StyleSheet.create({
  itemWrap: {
    width: SCREEN_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
});

/** Single review row. */
const ReviewRow = React.memo(function ReviewRow({
  review,
}: {
  review: Review;
}) {
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewName}>
          {review.user?.fullName ?? "Anonymous"}
        </Text>
        <Text style={styles.reviewStars}>
          {"★".repeat(review.rating)}
          {"☆".repeat(5 - review.rating)}
        </Text>
      </View>
      <Text style={styles.reviewBody}>{review.text}</Text>
      {review.images?.length ? (
        <View style={styles.reviewImagesWrap}>
          {review.images.map((uri, idx) => (
            <Image
              key={`${review.id}-${idx}`}
              source={{ uri }}
              style={styles.reviewImageThumb}
              contentFit="cover"
              transition={100}
            />
          ))}
        </View>
      ) : null}
      <Text style={styles.reviewDate}>
        {new Date(review.createdAt).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </Text>
    </View>
  );
});

const RelatedProductCard = React.memo(function RelatedProductCard({
  item,
  onPress,
}: {
  item: ProductSummary;
  onPress: (id: string) => void;
}) {
  const image = item.images?.[0] ?? fallbackImage;

  return (
    <Pressable style={relatedCardStyles.card} onPress={() => onPress(item.id)}>
      <Image
        source={{ uri: image }}
        style={relatedCardStyles.image}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />
      <Text style={relatedCardStyles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={relatedCardStyles.meta} numberOfLines={1}>
        {item.category?.name ?? "Collection"}
      </Text>
    </Pressable>
  );
});

const relatedCardStyles = StyleSheet.create({
  card: {
    width: 150,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  image: {
    width: "100%",
    height: 110,
    borderRadius: 0,
    backgroundColor: colors.cream,
  },
  title: {
    marginTop: spacing.sm,
    fontFamily: typography.serif,
    fontSize: 13,
    color: colors.charcoal,
  },
  meta: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeAvgRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / reviews.length;
}

function renderStars(avg: number): string {
  const full = Math.round(avg);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = typeof params.id === "string" ? params.id : "";
  const { session } = useAuth();
  const token = session?.accessToken ?? null;
  const userId = session?.user?.id ?? null;
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted, mutatingIds: wishlistMutatingIds } = useWishlist();
  const { isConnected } = useNetworkStatus();
  const { showToast } = useToast();

  // ---- State ----
  const [product, setProduct] = React.useState<ProductDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [showViewCart, setShowViewCart] = React.useState(false);
  const viewCartTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [rating, setRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState("");
  const [reviewImages, setReviewImages] = React.useState<ReviewImageAsset[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [hasLocalReviewSubmission, setHasLocalReviewSubmission] = React.useState(false);

  const [relatedProducts, setRelatedProducts] = React.useState<ProductSummary[]>([]);
  const [loadingRelated, setLoadingRelated] = React.useState(false);

  const [galleryIndex, setGalleryIndex] = React.useState(0);
  const [isViewerVisible, setIsViewerVisible] = React.useState(false);
  const [viewerIndex, setViewerIndex] = React.useState(0);

  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (viewCartTimerRef.current) {
        clearTimeout(viewCartTimerRef.current);
      }
    };
  }, []);

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: ({ signal }) => getProductById(productId, signal),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  React.useEffect(() => {
    setLoading(productQuery.isLoading);
    setProduct(productQuery.data?.product ?? null);
  }, [productQuery.isLoading, productQuery.data]);

  React.useEffect(() => {
    if (!product?.id) return;
    setGalleryIndex(0);
    setSelectedVariantId(product.variants?.[0]?.id ?? null);
  }, [product?.id, product?.variants]);

  // ---- Track recently viewed (fire-and-forget) ----
  React.useEffect(() => {
    if (!product?.id || !token) return;

    const controller = new AbortController();
    trackRecentlyViewed(product.id, controller.signal).catch(() => {
      // Silently ignore — not critical
    });

    return () => {
      controller.abort();
    };
  }, [product?.id, token]);

  // ---- Fetch related products ----
  React.useEffect(() => {
    if (!product?.id) return;

    const controller = new AbortController();
    let active = true;

    (async () => {
      setLoadingRelated(true);
      try {
        const related = await getRelatedProductsFromApi(product.id, 6, controller.signal);
        if (!active) return;
        setRelatedProducts(related ?? []);
      } catch (err) {
        if (isAbortError(err) || !active) return;
        if (active) setRelatedProducts([]);
      } finally {
        if (active) setLoadingRelated(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [product]);

  // ---- Fetch reviews ----
  React.useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setHasLocalReviewSubmission(false);
    setReviewImages([]);

    (async () => {
      try {
        const data = await fetchProductReviews(productId, controller.signal);
        if (active) setReviews(data ?? []);
      } catch (err) {
        if (isAbortError(err) || !active) return;
        if (active) setReviews([]);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [productId]);

  // ---- Derived ----
  const selectedVariant = product?.variants?.find(
    (v: ProductVariant) => v.id === selectedVariantId
  );
  const fallbackVariant = selectedVariant ?? product?.variants?.[0] ?? null;
  const images = product?.images?.length ? product.images : [fallbackImage];
  const avgRating = computeAvgRating(reviews);
  // Duplicate‐prevention: backend prevents via unique constraint; we hide the form
  // if any review matches the logged-in user's ID (review.user object may only
  // have fullName — compare loosely).
  const hasUserReviewed =
    hasLocalReviewSubmission ||
    Boolean(userId && reviews.length > 0 && reviews.some((r) => r.userId === userId));
  const outOfStock =
    fallbackVariant?.inventory != null && fallbackVariant.inventory.stock <= 0;

  // ---- Handlers ----
  const handleAddToCart = React.useCallback(async () => {
    if (!token) {
      showToast("Please sign in to add to cart", "info");
      router.push("/login");
      return;
    }
    if (!isConnected) {
      showToast("You're offline. Please check your connection.", "error");
      return;
    }
    if (!product || !fallbackVariant) {
      showToast(
        product?.variants?.length
          ? "Select a variant to continue"
          : "Variants are not available for this item",
        "info"
      );
      return;
    }
    if (outOfStock) {
      showToast("This variant is out of stock", "info");
      return;
    }
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        variantId: fallbackVariant.id,
        quantity: 1,
      });
      impactMedium();
      showToast("Added to cart", "success");
      setShowViewCart(true);
      if (viewCartTimerRef.current) clearTimeout(viewCartTimerRef.current);
      viewCartTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setShowViewCart(false);
      }, 6000);
    } catch {
      // CartProvider shows error toast
    } finally {
      if (mountedRef.current) setAdding(false);
    }
  }, [token, isConnected, product, fallbackVariant, outOfStock, addToCart, router, showToast]);

  const handlePickReviewImages = React.useCallback(async () => {
    if (reviewImages.length >= MAX_REVIEW_IMAGES) {
      setReviewError(`Maximum ${MAX_REVIEW_IMAGES} images allowed.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow photo library access to attach review images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_REVIEW_IMAGES - reviewImages.length,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.length) return;

    const nextAssets: ReviewImageAsset[] = [];
    for (const asset of result.assets) {
      if (typeof asset.fileSize === "number" && asset.fileSize > MAX_REVIEW_IMAGE_BYTES) {
        setReviewError(`Image \"${asset.fileName ?? "selected"}\" exceeds 2MB.`);
        return;
      }
      const ext = asset.fileName?.split(".").pop()?.toLowerCase() ?? "jpg";
      nextAssets.push({
        uri: asset.uri,
        fileName: asset.fileName ?? buildReviewImageName(nextAssets.length + 1),
        mimeType: asset.mimeType ?? `image/${ext}`,
      });
    }

    setReviewError(null);
    setReviewImages((prev) => [...prev, ...nextAssets].slice(0, MAX_REVIEW_IMAGES));
  }, [reviewImages.length]);

  const handleRemoveReviewImage = React.useCallback((index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmitReview = React.useCallback(async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!rating || !reviewText.trim()) {
      setReviewError("Please provide a rating and review.");
      return;
    }
    if (submitting) return;

    setReviewError(null);
    setSubmitting(true);

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticReview: Review = {
      id: optimisticId,
      rating,
      text: reviewText.trim(),
      images: reviewImages.map((img) => img.uri),
      createdAt: new Date().toISOString(),
      user: {
        fullName: session?.user?.email ?? session?.user?.phone ?? "You",
      },
    };

    setReviews((prev) => [optimisticReview, ...prev]);
    setHasLocalReviewSubmission(true);

    try {
      const uploadedImageUrls: string[] = [];
      for (const image of reviewImages) {
        const uploadedUrl = await uploadReviewImage(image);
        uploadedImageUrls.push(uploadedUrl);
      }

      await submitProductReview(
        productId,
        { rating, text: reviewText.trim(), images: uploadedImageUrls },
        token
      );

      const updated = await fetchProductReviews(productId);
      if (mountedRef.current) {
        setReviews(updated ?? []);
        setRating(0);
        setReviewText("");
        setReviewImages([]);
        notifySuccess();
        showToast("Review submitted", "success");
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setReviews((prev) => prev.filter((r) => r.id !== optimisticId));
      if (err instanceof ApiError && err.statusCode === 409) {
        setHasLocalReviewSubmission(true);
        setReviewError(null);
        showToast("You have already reviewed this product.", "info");
      } else {
        setHasLocalReviewSubmission(false);
        const msg = err instanceof Error ? err.message : "Failed to submit review";
        setReviewError(msg);
      }
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }, [
    token,
    rating,
    reviewText,
    reviewImages,
    session?.user?.email,
    session?.user?.phone,
    submitting,
    productId,
    router,
    showToast,
  ]);

  // ---- Gallery scroll handler ----
  const handleGalleryScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offset / IMAGE_WIDTH);
      setGalleryIndex(idx);
    },
    []
  );

  const openImageViewer = React.useCallback((index: number) => {
    setViewerIndex(index);
    setIsViewerVisible(true);
  }, []);

  const closeImageViewer = React.useCallback(() => {
    setIsViewerVisible(false);
  }, []);

  // ---- Key extractors & render callbacks (stable refs) ----
  const galleryKeyExtractor = React.useCallback(
    (_item: string, index: number) => `img-${index}`,
    []
  );

  const renderGalleryItem = React.useCallback(
    ({ item, index }: ListRenderItemInfo<string>) => (
      <Pressable onPress={() => openImageViewer(index)}>
        <GalleryImage uri={item} />
      </Pressable>
    ),
    [openImageViewer]
  );

  const renderViewerItem = React.useCallback(
    ({ item }: ListRenderItemInfo<string>) => (
      <ZoomableModalImage uri={item} onRequestClose={closeImageViewer} />
    ),
    [closeImageViewer]
  );

  const reviewKeyExtractor = React.useCallback(
    (item: Review) => item.id,
    []
  );

  const renderReviewItem = React.useCallback(
    ({ item }: ListRenderItemInfo<Review>) => <ReviewRow review={item} />,
    []
  );

  const relatedKeyExtractor = React.useCallback((item: ProductSummary) => item.id, []);

  const handleRelatedPress = React.useCallback(
    (id: string) => {
      router.push({ pathname: "/product/[id]", params: { id } });
    },
    [router]
  );

  const renderRelatedItem = React.useCallback(
    ({ item }: ListRenderItemInfo<ProductSummary>) => (
      <RelatedProductCard item={item} onPress={handleRelatedPress} />
    ),
    [handleRelatedPress]
  );

  // ---- Variant press handler (avoids inline closure per-item) ----
  const handleVariantPress = React.useCallback((id: string) => {
    impactLight();
    setSelectedVariantId(id);
  }, []);

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showMenu showBack showWishlist showCart />
        <ScrollView contentContainerStyle={styles.container}>
          <SkeletonBlock
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            borderRadius={radius.lg}
            style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}
          />
          <View style={[styles.detailsCard, { marginTop: spacing.lg }]}>
            <SkeletonBlock width="40%" height={10} />
            <SkeletonBlock width="80%" height={20} style={{ marginTop: spacing.sm }} />
            <SkeletonBlock width="100%" height={12} style={{ marginTop: spacing.sm }} />
            <SkeletonBlock width="30%" height={18} style={{ marginTop: spacing.md }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showMenu showBack showWishlist showCart />
        <View style={styles.centerCard}>
          <Text style={styles.emptyTitle}>Product unavailable</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showMenu showBack showWishlist showCart />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* ---- Image gallery with paging dots ---- */}
        <View style={styles.galleryFrame}>
          <FlatList
            data={images}
            keyExtractor={galleryKeyExtractor}
            horizontal
            pagingEnabled
            snapToInterval={IMAGE_WIDTH}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={handleGalleryScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.galleryContainer}
            getItemLayout={(_data, index) => ({
              length: IMAGE_WIDTH,
              offset: IMAGE_WIDTH * index,
              index,
            })}
            renderItem={renderGalleryItem}
          />
          {images.length > 1 ? (
            <View style={styles.galleryIndexBadge}>
              <Text style={styles.galleryIndexText}>
                {galleryIndex + 1}/{images.length}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Dots indicator */}
        {images.length > 1 && (
          <View style={styles.dotsRow}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === galleryIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}

        {/* ---- Details card ---- */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsTopRow}>
            <Text style={styles.categoryLabel}>
              {product.category?.name ?? "Curated Collection"}
            </Text>
            <View style={styles.detailsBadge}>
              <Text style={styles.detailsBadgeText}>Luxury Edit</Text>
            </View>
          </View>
          <Text style={styles.productTitle}>{product.title}</Text>

          {/* Average rating */}
          {reviews.length > 0 && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStars}>{renderStars(avgRating)}</Text>
              <Text style={styles.ratingText}>
                {avgRating.toFixed(1)} ({reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"})
              </Text>
            </View>
          )}

          <Text style={styles.productDescription}>
            {product.description ??
              "Curated premium listing with verified quality assurance."}
          </Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price</Text>
            <View style={styles.priceValues}>
              <Text style={styles.priceValue}>
                {selectedVariant ? currency.format(selectedVariant.price) : "—"}
              </Text>
              {selectedVariant?.compareAtPrice != null &&
                selectedVariant.compareAtPrice > selectedVariant.price && (
                  <Text style={styles.comparePrice}>
                    {currency.format(selectedVariant.compareAtPrice)}
                  </Text>
                )}
            </View>
          </View>

          {/* Stock indicator */}
          {selectedVariant?.inventory != null && (
            <Text
              style={[
                styles.stockText,
                outOfStock && styles.stockTextOut,
              ]}
            >
              {outOfStock
                ? "Out of stock"
                : selectedVariant.inventory.stock <= 5
                  ? `Only ${selectedVariant.inventory.stock} left`
                  : "In stock"}
            </Text>
          )}

          {/* Variant selector */}
          <View style={styles.variantRow}>
            <Text style={styles.variantLabel}>Select Variant</Text>
            <View style={styles.variantWrap}>
              {product.variants?.length ? (
                product.variants.map((variant: ProductVariant) => {
                  const active = variant.id === selectedVariantId;
                  const variantOOS =
                    variant.inventory != null && variant.inventory.stock <= 0;
                  return (
                    <Pressable
                      key={variant.id}
                      style={[
                        styles.variantChip,
                        active && styles.variantChipActive,
                        variantOOS && styles.variantChipDisabled,
                      ]}
                      onPress={() => handleVariantPress(variant.id)}
                      disabled={variantOOS}
                    >
                      <Text
                        style={[
                          styles.variantChipText,
                          active && styles.variantChipTextActive,
                          variantOOS && styles.variantChipTextDisabled,
                        ]}
                      >
                        {variant.sku}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={styles.mutedText}>Variants coming soon.</Text>
              )}
            </View>
          </View>

          {/* Add to cart + Wishlist row */}
          <View style={styles.actionRow}>
            <AnimatedPressable
              style={[
                styles.primaryButton,
                styles.primaryAction,
                (outOfStock || adding) && styles.buttonDisabled,
              ]}
              onPress={handleAddToCart}
              disabled={outOfStock || adding}
              hitSlop={10}
            >
              {adding ? (
                <TatvivahLoader size="sm" color={colors.background} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {!selectedVariant
                    ? "Select variant"
                    : outOfStock
                      ? "Out of stock"
                      : "Add to cart"}
                </Text>
              )}
            </AnimatedPressable>

            {/* Wishlist heart */}
            <Pressable
              onPress={() => {
                if (!token) {
                  router.push("/login");
                  return;
                }
                if (product) {
                  impactLight();
                  toggleWishlist(product.id);
                }
              }}
              disabled={!product || wishlistMutatingIds.has(product?.id ?? "")}
              style={[
                styles.wishlistButton,
                product && isWishlisted(product.id) && styles.wishlistButtonActive,
              ]}
              hitSlop={8}
            >
              <Text style={{ fontSize: 22 }}>
                {product && isWishlisted(product.id) ? "❤️" : "🤍"}
              </Text>
            </Pressable>
          </View>

          {showViewCart && (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/cart")}
            >
              <Text style={styles.secondaryButtonText}>View cart</Text>
            </Pressable>
          )}
        </View>

        {/* ---- Reviews section ---- */}
        <View style={styles.reviewsCard}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>

          {/* Review form — hidden if user already reviewed */}
          {!hasUserReviewed && token ? (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewLabel}>Your rating</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                    hitSlop={6}
                  >
                    <Text
                      style={rating >= star ? styles.starActive : styles.starInactive}
                    >
                      ★
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.reviewLabel}>Your review</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your thoughts..."
                placeholderTextColor={colors.brownSoft}
                value={reviewText}
                onChangeText={setReviewText}
                multiline
              />

              <Text style={styles.reviewLabel}>Photos (optional)</Text>
              <View style={styles.reviewImageRow}>
                {reviewImages.map((image, index) => (
                  <View key={`${image.uri}-${index}`} style={styles.reviewImagePreviewWrap}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.reviewImagePreview}
                      contentFit="cover"
                    />
                    <Pressable
                      onPress={() => handleRemoveReviewImage(index)}
                      style={styles.reviewImageRemoveBtn}
                    >
                      <Text style={styles.reviewImageRemoveText}>×</Text>
                    </Pressable>
                  </View>
                ))}

                {reviewImages.length < MAX_REVIEW_IMAGES && (
                  <Pressable
                    style={styles.reviewImageAddBtn}
                    onPress={handlePickReviewImages}
                    disabled={submitting}
                  >
                    <Text style={styles.reviewImageAddText}>+ Add</Text>
                  </Pressable>
                )}
              </View>

              {reviewError ? (
                <Text style={styles.errorText}>{reviewError}</Text>
              ) : null}
              <AnimatedPressable
                style={[styles.secondaryButton, submitting && styles.buttonDisabled]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <TatvivahLoader size="sm" color={colors.charcoal} />
                ) : (
                  <Text style={styles.secondaryButtonText}>Submit review</Text>
                )}
              </AnimatedPressable>
            </View>
          ) : hasUserReviewed ? (
            <Text style={styles.mutedText}>
              You have already reviewed this product.
            </Text>
          ) : (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.secondaryButtonText}>Sign in to review</Text>
            </Pressable>
          )}

          {/* Reviews list — FlatList with optimized rendering */}
          {reviews.length === 0 ? (
            <Text style={[styles.mutedText, { marginTop: spacing.md }]}>
              No reviews yet. Be the first!
            </Text>
          ) : (
            <FlatList
              data={reviews}
              keyExtractor={reviewKeyExtractor}
              renderItem={renderReviewItem}
              scrollEnabled={false}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={3}
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>

        {/* ---- Related products ---- */}
        <View style={styles.relatedWrap}>
          <Text style={styles.sectionTitle}>You may also like</Text>

          {loadingRelated ? (
            <View style={styles.relatedLoadingWrap}>
              <TatvivahLoader size="sm" color={colors.gold} />
            </View>
          ) : relatedProducts.length === 0 ? (
            <Text style={styles.mutedText}>More products coming soon.</Text>
          ) : (
            <FlatList
              data={relatedProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={relatedKeyExtractor}
              renderItem={renderRelatedItem}
              contentContainerStyle={styles.relatedListContent}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.viewerOverlay}>
          <Pressable style={styles.viewerCloseButton} onPress={closeImageViewer}>
            <Text style={styles.viewerCloseText}>Close</Text>
          </Pressable>

          <FlatList
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={viewerIndex}
            keyExtractor={galleryKeyExtractor}
            renderItem={renderViewerItem}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const next = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              setViewerIndex(next);
            }}
          />

          <Text style={styles.viewerHintText}>
            {viewerIndex + 1}/{images.length} • Pinch/Double tap • Drag down to close
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingBottom: spacing.xxl,
  },

  // Gallery
  galleryFrame: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.sm,
  },
  galleryContainer: {
    paddingHorizontal: spacing.lg,
  },
  galleryIndexBadge: {
    position: "absolute",
    bottom: 10,
    right: spacing.lg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
    backgroundColor: "rgba(44, 40, 37, 0.65)",
  },
  galleryIndexText: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.warmWhite,
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 0,
    backgroundColor: colors.borderSoft,
  },
  dotActive: {
    backgroundColor: colors.gold,
    width: 8,
    height: 8,
    borderRadius: 0,
  },

  // Details
  detailsCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 0,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  detailsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  categoryLabel: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  detailsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "rgba(196, 167, 108, 0.12)",
  },
  detailsBadgeText: {
    fontFamily: typography.sansMedium,
    fontSize: 9,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  productTitle: {
    marginTop: spacing.xs,
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.charcoal,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  ratingStars: {
    fontSize: 14,
    color: colors.gold,
  },
  ratingText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  productDescription: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brownSoft,
  },
  priceRow: {
    marginTop: spacing.md,
  },
  priceLabel: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  priceValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  priceValue: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
  },
  comparePrice: {
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.brownSoft,
    textDecorationLine: "line-through",
  },
  stockText: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 11,
    color: "#5A8F5A",
  },
  stockTextOut: {
    color: colors.gold,
  },

  // Variants
  variantRow: {
    marginTop: spacing.md,
  },
  variantLabel: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  variantWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  variantChip: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 0,
    backgroundColor: colors.warmWhite,
  },
  variantChipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.cream,
  },
  variantChipDisabled: {
    opacity: 0.4,
  },
  variantChipText: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brown,
  },
  variantChipTextActive: {
    color: colors.charcoal,
  },
  variantChipTextDisabled: {
    color: colors.brownSoft,
    textDecorationLine: "line-through",
  },

  // Buttons
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.gold,
    borderRadius: 0,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  primaryAction: {
    flex: 1,
    marginTop: 0,
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
  secondaryButton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: 12,
    borderRadius: 0,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.charcoal,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  wishlistButton: {
    width: 52,
    height: 52,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistButtonActive: {
    borderColor: "#E8453C",
    backgroundColor: "#3B1E22",
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(250, 247, 242, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  loaderText: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },

  // Reviews
  reviewsCard: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 0,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  sectionTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  reviewForm: {
    marginTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  reviewLabel: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  starRow: {
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  starButton: {
    marginRight: spacing.xs,
  },
  starActive: {
    color: colors.gold,
    fontSize: 22,
  },
  starInactive: {
    color: colors.borderSoft,
    fontSize: 22,
  },
  reviewInput: {
    marginTop: spacing.sm,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    padding: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.charcoal,
    textAlignVertical: "top",
    backgroundColor: colors.background,
  },
  reviewImageRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  reviewImagePreviewWrap: {
    width: 56,
    height: 56,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.cream,
  },
  reviewImagePreview: {
    width: "100%",
    height: "100%",
  },
  reviewImageRemoveBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    backgroundColor: colors.charcoal,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewImageRemoveText: {
    color: colors.background,
    fontSize: 13,
    lineHeight: 13,
  },
  reviewImageAddBtn: {
    width: 56,
    height: 56,
    borderRadius: 0,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  reviewImageAddText: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
    textTransform: "uppercase",
  },
  reviewItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewName: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.charcoal,
  },
  reviewStars: {
    fontSize: 12,
    color: colors.gold,
  },
  reviewBody: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brownSoft,
  },
  reviewImagesWrap: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
  },
  reviewImageThumb: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.cream,
  },
  reviewDate: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.borderSoft,
  },
  errorText: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.gold,
  },
  mutedText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    marginTop: spacing.sm,
  },

  // Related products
  relatedWrap: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 0,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  relatedListContent: {
    marginTop: spacing.md,
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  relatedCard: {
    width: 150,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 0,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  relatedImage: {
    width: "100%",
    height: 110,
    borderRadius: 0,
    backgroundColor: colors.cream,
  },
  relatedTitle: {
    marginTop: spacing.sm,
    fontFamily: typography.serif,
    fontSize: 13,
    color: colors.charcoal,
  },
  relatedMeta: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
  },
  relatedLoadingWrap: {
    marginTop: spacing.md,
    alignItems: "center",
  },

  // Utility
  centerCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: 0,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    ...shadow.card,
  },
  emptyTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
    marginBottom: spacing.md,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  viewerCloseButton: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.lg,
    zIndex: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  viewerCloseText: {
    color: "#FFFFFF",
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  viewerHintText: {
    position: "absolute",
    bottom: spacing.xl,
    alignSelf: "center",
    color: "rgba(255,255,255,0.92)",
    fontFamily: typography.sans,
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
