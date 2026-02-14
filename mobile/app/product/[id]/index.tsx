import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  TextInput,
  Dimensions,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import {
  getProductById,
  type ProductDetail,
  type ProductSummary,
  type ProductVariant,
} from "../../../src/services/products";
import {
  fetchProductReviews,
  submitProductReview,
  type Review,
} from "../../../src/services/reviews";
import { useAuth } from "../../../src/hooks/useAuth";
import { useCart } from "../../../src/providers/CartProvider";
import { useNetworkStatus } from "../../../src/hooks/useNetworkStatus";
import { useToast } from "../../../src/providers/ToastProvider";
import { isAbortError } from "../../../src/services/api";
import { SkeletonBlock } from "../../../src/components/Skeleton";
import { AnimatedPressable } from "../../../src/components/AnimatedPressable";
import { impactMedium, impactLight, notifySuccess } from "../../../src/utils/haptics";

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
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
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
  const { isConnected } = useNetworkStatus();
  const { showToast } = useToast();

  // ---- State ----
  const [product, setProduct] = React.useState<ProductDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [rating, setRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);

  const [galleryIndex, setGalleryIndex] = React.useState(0);

  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---- Fetch product ----
  React.useEffect(() => {
    const controller = new AbortController();
    let active = true;

    (async () => {
      setLoading(true);
      setGalleryIndex(0);
      try {
        const response = await getProductById(productId, controller.signal);
        if (!active) return;
        const p = response.product;
        setProduct(p);
        setSelectedVariantId(p.variants?.[0]?.id ?? null);
      } catch (err) {
        if (isAbortError(err) || !active) return;
        if (active) setProduct(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [productId]);

  // ---- Fetch reviews ----
  React.useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await fetchProductReviews(productId);
        if (active) setReviews(data ?? []);
      } catch (err) {
        if (isAbortError(err) || !active) return;
        if (active) setReviews([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [productId]);

  // ---- Derived ----
  const selectedVariant = product?.variants?.find(
    (v: ProductVariant) => v.id === selectedVariantId
  );
  const images = product?.images?.length ? product.images : [fallbackImage];
  const avgRating = computeAvgRating(reviews);
  // Duplicate‐prevention: backend prevents via unique constraint; we hide the form
  // if any review matches the logged-in user's ID (review.user object may only
  // have fullName — compare loosely).
  const hasUserReviewed = Boolean(
    userId && reviews.length > 0 && reviews.some((r) => (r as any).userId === userId)
  );
  const outOfStock =
    selectedVariant?.inventory != null && selectedVariant.inventory.stock <= 0;

  // ---- Handlers ----
  const handleAddToCart = React.useCallback(async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!isConnected) {
      showToast("You're offline. Please check your connection.", "error");
      return;
    }
    if (!product || !selectedVariant || outOfStock) return;
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity: 1,
      });
      impactMedium();
      showToast("Added to cart", "success");
    } catch {
      // CartProvider shows error toast
    } finally {
      if (mountedRef.current) setAdding(false);
    }
  }, [token, isConnected, product, selectedVariant, outOfStock, addToCart, router, showToast]);

  const handleSubmitReview = React.useCallback(async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!rating || !reviewText.trim()) {
      setReviewError("Please provide a rating and review.");
      return;
    }
    setReviewError(null);
    setSubmitting(true);
    try {
      await submitProductReview(
        productId,
        { rating, text: reviewText.trim(), images: [] },
        token
      );
      const updated = await fetchProductReviews(productId);
      if (mountedRef.current) {
        setReviews(updated ?? []);
        setRating(0);
        setReviewText("");
        notifySuccess();
        showToast("Review submitted", "success");
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : "Failed to submit review";
      setReviewError(msg);
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }, [token, rating, reviewText, productId, router, showToast]);

  // ---- Gallery scroll handler ----
  const handleGalleryScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offset / IMAGE_WIDTH);
      setGalleryIndex(idx);
    },
    []
  );

  // ---- Key extractors & render callbacks (stable refs) ----
  const galleryKeyExtractor = React.useCallback(
    (_item: string, index: number) => `img-${index}`,
    []
  );

  const renderGalleryItem = React.useCallback(
    ({ item }: ListRenderItemInfo<string>) => <GalleryImage uri={item} />,
    []
  );

  const reviewKeyExtractor = React.useCallback(
    (item: Review) => item.id,
    []
  );

  const renderReviewItem = React.useCallback(
    ({ item }: ListRenderItemInfo<Review>) => <ReviewRow review={item} />,
    []
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
      <ScrollView contentContainerStyle={styles.container}>
        {/* ---- Back button ---- */}
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* ---- Image gallery with paging dots ---- */}
        <FlatList
          data={images}
          keyExtractor={galleryKeyExtractor}
          horizontal
          pagingEnabled
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
          <Text style={styles.categoryLabel}>
            {product.category?.name ?? "Curated Collection"}
          </Text>
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

          {/* Add to cart */}
          <AnimatedPressable
            style={[
              styles.primaryButton,
              (outOfStock || adding) && styles.buttonDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={outOfStock || adding}
          >
            {adding ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {outOfStock ? "Out of stock" : "Add to cart"}
              </Text>
            )}
          </AnimatedPressable>
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
              {reviewError ? (
                <Text style={styles.errorText}>{reviewError}</Text>
              ) : null}
              <AnimatedPressable
                style={[styles.secondaryButton, submitting && styles.buttonDisabled]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.charcoal} size="small" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Submit review</Text>
                )}
              </AnimatedPressable>
            </View>
          ) : hasUserReviewed ? (
            <Text style={styles.mutedText}>
              You've already reviewed this product.
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
      </ScrollView>
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
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backText: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.brownSoft,
  },

  // Gallery
  galleryContainer: {
    paddingHorizontal: spacing.lg,
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
    borderRadius: 3,
    backgroundColor: colors.borderSoft,
  },
  dotActive: {
    backgroundColor: colors.gold,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Details
  detailsCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  categoryLabel: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
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
    color: "#A65D57",
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
    borderRadius: 20,
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
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
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
    borderRadius: radius.md,
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

  // Reviews
  reviewsCard: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
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
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.charcoal,
    textAlignVertical: "top",
    backgroundColor: colors.background,
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
    color: "#A65D57",
  },
  mutedText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    marginTop: spacing.sm,
  },

  // Utility
  centerCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
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
});
