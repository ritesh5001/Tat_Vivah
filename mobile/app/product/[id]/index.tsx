import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { getProductById, type ProductDetail } from "../../../src/services/products";
import { fetchProductReviews, submitProductReview, type Review } from "../../../src/services/reviews";
import { useAuth } from "../../../src/hooks/useAuth";
import { useCart } from "../../../src/providers/CartProvider";
import { useNetworkStatus } from "../../../src/hooks/useNetworkStatus";
import { useToast } from "../../../src/providers/ToastProvider";

const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = typeof params.id === "string" ? params.id : "";
  const { session } = useAuth();
  const token = session?.accessToken ?? null;
  const { addToCart } = useCart();
  const { isConnected } = useNetworkStatus();
  const { showToast } = useToast();

  const [product, setProduct] = React.useState<ProductDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [rating, setRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await getProductById(productId);
        if (active) {
          const nextProduct = response.product;
          setProduct(nextProduct);
          setSelectedVariantId(nextProduct.variants?.[0]?.id ?? null);
        }
      } catch {
        if (active) setProduct(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (productId) {
      load();
    }

    return () => {
      active = false;
    };
  }, [productId]);

  React.useEffect(() => {
    let active = true;
    const loadReviews = async () => {
      try {
        const data = await fetchProductReviews(productId);
        if (active) setReviews(data ?? []);
      } catch {
        if (active) setReviews([]);
      }
    };
    if (productId) {
      loadReviews();
    }
    return () => { active = false; };
  }, [productId]);

  const selectedVariant = product?.variants?.find(
    (variant: ProductDetail["variants"][number]) => variant.id === selectedVariantId
  );

  const handleAddToCart = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!isConnected) {
      showToast("You're offline. Please check your connection.", "error");
      return;
    }
    if (!product || !selectedVariant) return;
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity: 1,
      });
      router.push("/cart");
    } catch {
      // Error toast is shown by CartProvider
    } finally {
      setAdding(false);
    }
  };

  const handleSubmitReview = async () => {
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
      setReviews(updated ?? []);
      setRating(0);
      setReviewText("");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Product unavailable.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const images = product.images?.length ? product.images : [fallbackImage];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <FlatList
          data={images}
          keyExtractor={(item, index) => `${item}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageRow}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={styles.heroImage}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
            />
          )}
        />

        <View style={styles.detailsCard}>
          <Text style={styles.categoryLabel}>
            {product.category?.name ?? "Curated Collection"}
          </Text>
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productDescription}>
            {product.description ??
              "Curated premium listing with verified quality assurance."}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>
              {selectedVariant ? currency.format(selectedVariant.price) : "—"}
            </Text>
          </View>

          <View style={styles.variantRow}>
            <Text style={styles.variantLabel}>Select Variant</Text>
            <View style={styles.variantWrap}>
              {product.variants?.length ? (
                product.variants.map((variant: ProductDetail["variants"][number]) => {
                  const active = variant.id === selectedVariantId;
                  return (
                    <Pressable
                      key={variant.id}
                      style={[styles.variantChip, active && styles.variantChipActive]}
                      onPress={() => setSelectedVariantId(variant.id)}
                    >
                      <Text
                        style={[
                          styles.variantChipText,
                          active && styles.variantChipTextActive,
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

          <Pressable style={styles.primaryButton} onPress={handleAddToCart}>
            <Text style={styles.primaryButtonText}>
              {adding ? "Adding..." : "Add to cart"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.reviewsCard}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>

          <View style={styles.reviewForm}>
            <Text style={styles.reviewLabel}>Your rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Text style={rating >= star ? styles.starActive : styles.starInactive}>
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
            {reviewError ? <Text style={styles.errorText}>{reviewError}</Text> : null}
            <Pressable style={styles.secondaryButton} onPress={handleSubmitReview}>
              <Text style={styles.secondaryButtonText}>
                {submitting ? "Submitting..." : "Submit review"}
              </Text>
            </Pressable>
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.mutedText}>No reviews yet.</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <Text style={styles.reviewName}>
                  {review.user?.fullName ?? "Anonymous"}
                </Text>
                <Text style={styles.reviewMeta}>Rating {review.rating} / 5</Text>
                <Text style={styles.reviewBody}>{review.text}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingBottom: spacing.xl,
  },
  imageRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  heroImage: {
    width: 280,
    height: 360,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
  },
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
  productDescription: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
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
  priceValue: {
    marginTop: spacing.xs,
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
  },
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
  variantChipText: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brown,
  },
  variantChipTextActive: {
    color: colors.charcoal,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
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
    fontSize: 18,
  },
  starInactive: {
    color: colors.borderSoft,
    fontSize: 18,
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
  },
  secondaryButton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.sm,
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
  reviewItem: {
    marginTop: spacing.md,
  },
  reviewName: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.charcoal,
  },
  reviewMeta: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
  },
  reviewBody: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
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
  loadingCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    ...shadow.card,
  },
  loadingText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
});
