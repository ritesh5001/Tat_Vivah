import * as React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Platform,
  useWindowDimensions,
  Alert,
  Modal,
  Share,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "../../../src/components/CompatImage";
import { Ionicons } from "@expo/vector-icons";
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
import { WishlistIcon } from "../../../src/components/WishlistIcon";
import { impactMedium, impactLight, notifySuccess } from "../../../src/utils/haptics";
import { AppHeader } from "../../../src/components/AppHeader";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  uploadTryOnImage,
  type ReviewImageAsset,
} from "../../../src/services/imagekit";
import {
  createVirtualTryOn,
  type TryOnResult,
} from "../../../src/services/tryOn";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEWER_MIN_WIDTH = 1;

const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const MAX_REVIEW_IMAGES = 3;
const MAX_REVIEW_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TRY_ON_IMAGE_BYTES = 8 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Memoised sub-components (extracted from render for FlatList perf)
// ---------------------------------------------------------------------------

/** Single gallery image with full-width paging. */
const GalleryImage = React.memo(function GalleryImage({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) {
  return (
    <Image
      source={{ uri }}
      style={[galleryStyles.image, { width, height }]}
      contentFit="contain"
      transition={200}
      cachePolicy="memory-disk"
    />
  );
});

const galleryStyles = StyleSheet.create({
  image: {
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
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
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
    aspectRatio: 3 / 4,
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

function normalizeColor(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

const colorHexMap: Record<string, string> = {
  white: "#ffffff",
  black: "#111111",
  navy: "#0f172a",
  blue: "#1d4ed8",
  beige: "#f5f5dc",
  cream: "#F8F1E5",
  grey: "#71717a",
  gray: "#71717a",
  maroon: "#7f1d1d",
  green: "#15803d",
  yellow: "#facc15",
  red: "#dc2626",
};

function fallbackColorFromText(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 55%, 55%)`;
}

function swatchColorFromLabel(label: string): string {
  const normalized = normalizeColor(label);
  if (!normalized) return "#71717a";

  if (colorHexMap[normalized]) {
    return colorHexMap[normalized];
  }

  if (
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized) ||
    /^rgb\(/i.test(normalized) ||
    /^hsl\(/i.test(normalized) ||
    /^[a-z][a-z\s-]*$/i.test(normalized)
  ) {
    return normalized;
  }

  return fallbackColorFromText(normalized);
}

function getVariantColorLabel(variant: ProductVariant): string {
  return variant.color?.trim() || "Default";
}

function getVariantSizeLabel(variant: ProductVariant): string {
  const raw = variant.size?.trim();
  if (!raw) return "Default";
  // Backend often stores SKU codes ("LB36", "DB44") in the size field. Show the
  // numeric size when present so users see clean values (36, 38, 40, 42).
  const numeric = raw.match(/\d+/)?.[0];
  return numeric ?? raw;
}

function seededRandom(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const range = (max - min) * 10;
  return min + (hash % range) / 10;
}

function formatDeliveryEstimate(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// Lightweight HTML cleaner for product descriptions. Splits paragraphs, decodes
// common entities, and strips remaining tags so users see formatted text rather
// than `<p>...</p>` markup.
function htmlToParagraphs(html: string): string[] {
  if (!html) return [];
  const decoded = html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”");

  const blocks = decoded
    .split(/<\/?(?:p|div|br\s*\/?|li)\s*\/?>/i)
    .map((chunk) => chunk.replace(/<[^>]+>/g, "").trim())
    .filter((chunk) => chunk.length > 0);

  return blocks.length > 0 ? blocks : [decoded.replace(/<[^>]+>/g, "").trim()];
}

function mimeTypeFromAsset(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.mimeType) return asset.mimeType;
  const ext = asset.fileName?.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ProductDetailScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
  const [selectedColor, setSelectedColor] = React.useState<string>("");
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
  const [tryOnUserImageUri, setTryOnUserImageUri] = React.useState<string | null>(null);
  const [tryOnUserImageAsset, setTryOnUserImageAsset] = React.useState<ReviewImageAsset | null>(null);
  const [tryOnResult, setTryOnResult] = React.useState<TryOnResult | null>(null);
  const [tryOnError, setTryOnError] = React.useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = React.useState(false);
  const [isTryOnVisible, setIsTryOnVisible] = React.useState(false);
  const tryOnAbortRef = React.useRef<AbortController | null>(null);

  const WEB_BOTTOM_OFFSET = 16;
  const stickyBottomOffset = Platform.OS === "web"
    ? WEB_BOTTOM_OFFSET
    : Math.max(insets.bottom, spacing.sm);
  const galleryWidth = Math.max(windowWidth - spacing.lg * 2, 260);
  const galleryHeight = Math.round(galleryWidth * (4 / 3));
  const stickyActionHeight = 96;
  const stickyReserveSpace = stickyBottomOffset + stickyActionHeight + spacing.xl;
  const viewerWidth = Math.max(windowWidth, VIEWER_MIN_WIDTH);
  const isCompactLayout = windowWidth < 380;

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
      tryOnAbortRef.current?.abort();
    };
  }, []);

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: ({ signal }) => getProductById(productId, signal),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });

  React.useEffect(() => {
    setLoading(productQuery.isLoading);
    setProduct(productQuery.data?.product ?? null);
  }, [productQuery.isLoading, productQuery.data]);

  React.useEffect(() => {
    const variants = product?.variants ?? [];
    const currentVariant = variants.find((variant) => variant.id === selectedVariantId);

    if (currentVariant) {
      const nextColor = normalizeColor(getVariantColorLabel(currentVariant));
      setSelectedColor((previousColor) => (
        previousColor === nextColor ? previousColor : nextColor
      ));
      return;
    }

    const firstVariant = variants[0];
    if (firstVariant) {
      setSelectedVariantId(firstVariant.id);
      setSelectedColor(normalizeColor(getVariantColorLabel(firstVariant)));
      return;
    }

    setSelectedColor("");
  }, [product?.variants, selectedVariantId]);

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
  const colorOptions = React.useMemo(() => {
    const variants = product?.variants ?? [];
    const map = new Map<string, string>();
    for (const variant of variants) {
      const label = getVariantColorLabel(variant);
      const key = normalizeColor(label);
      if (!map.has(key)) {
        map.set(key, label);
      }
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [product?.variants]);

  const variantsForColor = React.useMemo(() => {
    const variants = product?.variants ?? [];
    if (!selectedColor) return variants;
    return variants.filter((variant) => normalizeColor(getVariantColorLabel(variant)) === selectedColor);
  }, [product?.variants, selectedColor]);

  const fallbackVariant = selectedVariant ?? variantsForColor[0] ?? product?.variants?.[0] ?? null;
  const productAny = product as any;
  const salePrice =
    fallbackVariant?.price ??
    productAny?.salePrice ??
    productAny?.adminPrice ??
    productAny?.price ??
    null;
  const productSeed = productAny?.id ?? "";
  // Only treat the backend's compare-at as "real" when it's strictly greater than sale.
  const candidateCompareAt =
    fallbackVariant?.compareAtPrice ??
    productAny?.compareAtPrice ??
    productAny?.regularPrice ??
    null;
  const realCompareAt =
    typeof candidateCompareAt === "number" &&
    typeof salePrice === "number" &&
    candidateCompareAt > salePrice
      ? candidateCompareAt
      : null;
  const fakeCompareAt =
    realCompareAt === null && typeof salePrice === "number" && salePrice > 0 && productSeed
      ? Math.round(salePrice / (1 - Math.round(seededRandom(productSeed + "m", 50, 75)) / 100) / 10) * 10
      : null;
  const compareAtPrice = realCompareAt ?? fakeCompareAt;
  const hasDiscount =
    typeof salePrice === "number" &&
    typeof compareAtPrice === "number" &&
    compareAtPrice > salePrice;
  const savingsAmount = hasDiscount ? compareAtPrice - salePrice : 0;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - salePrice) / compareAtPrice) * 100)
    : 0;
  const productRating = productSeed ? Math.round(seededRandom(productSeed, 39, 48)) / 10 : 4.2;
  const productReviewCount = productSeed ? Math.round(seededRandom(productSeed + "r", 50, 500)) : 0;
  const productViewerCount = productSeed ? Math.round(seededRandom(productSeed + "v", 200, 900)) : 0;
  const deliveryEstimate = formatDeliveryEstimate(6);
  const selectedColorImages = React.useMemo(() => {
    const selectedVariantImages =
      selectedVariant?.images?.filter(
        (image): image is string => typeof image === "string" && image.trim().length > 0
      ) ?? [];

    if (selectedVariantImages.length > 0) {
      return selectedVariantImages;
    }

    const firstColorImageSet =
      variantsForColor.find(
        (variant) => Array.isArray(variant.images) && variant.images.length > 0
      )?.images ?? [];

    return firstColorImageSet.length > 0
      ? firstColorImageSet
      : product?.images?.length
        ? product.images
        : [];
  }, [product?.images, selectedVariant, variantsForColor]);
  const images =
    selectedColorImages.length
      ? selectedColorImages
      : product?.images?.length
        ? product.images
        : [fallbackImage];
  const avgRating = computeAvgRating(reviews);
  // Duplicate‐prevention: backend prevents via unique constraint; we hide the form
  // if any review matches the logged-in user's ID (review.user object may only
  // have fullName — compare loosely).
  const hasUserReviewed =
    hasLocalReviewSubmission ||
    Boolean(userId && reviews.length > 0 && reviews.some((r) => r.userId === userId));
  const outOfStock =
    fallbackVariant?.inventory != null && fallbackVariant.inventory.stock <= 0;

  React.useEffect(() => {
    setGalleryIndex(0);
  }, [selectedColor, product?.id]);

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

  const handleBuyNow = React.useCallback(async () => {
    if (!token) {
      showToast("Please sign in to continue", "info");
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
      router.push("/checkout");
    } catch {
      // CartProvider handles toast messaging
    } finally {
      if (mountedRef.current) setAdding(false);
    }
  }, [token, isConnected, product, fallbackVariant, outOfStock, addToCart, router, showToast]);

  const handleShareProduct = React.useCallback(async () => {
    try {
      const shareTitle = product?.title?.trim() || "TatVivah product";
      const webUrl = `https://tatvivahtrends.com/product/${productId}`;
      const deepLink = `tatvivah://product/${productId}`;

      // Try to share a deep link (so devices that support URL schemes can open the app),
      // include the web URL as a fallback in the message so recipients without the app
      // can still open the product page in the browser.
      await Share.share({
        title: shareTitle,
        message: `${shareTitle}\n${webUrl}`,
        url: deepLink,
      });
    } catch {
      // no-op on cancel/error
    }
  }, [product?.title, productId]);

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

  const handleTryOnAsset = React.useCallback((asset?: ImagePicker.ImagePickerAsset) => {
    if (!asset) return;
    if (typeof asset.fileSize === "number" && asset.fileSize > MAX_TRY_ON_IMAGE_BYTES) {
      setTryOnError("Choose an image under 8MB for virtual try-on.");
      return;
    }

    setTryOnUserImageUri(asset.uri);
    setTryOnUserImageAsset({
      uri: asset.uri,
      fileName: asset.fileName ?? `tryon-${Date.now()}.jpg`,
      mimeType: mimeTypeFromAsset(asset),
    });
    setTryOnResult(null);
    setTryOnError(null);
  }, []);

  const handleCaptureTryOnPhoto = React.useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow camera access to take a try-on photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.86,
    });

    if (!result.canceled) {
      handleTryOnAsset(result.assets?.[0]);
    }
  }, [handleTryOnAsset]);

  const handlePickTryOnPhoto = React.useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow photo library access to upload a try-on photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.86,
      allowsMultipleSelection: false,
    });

    if (!result.canceled) {
      handleTryOnAsset(result.assets?.[0]);
    }
  }, [handleTryOnAsset]);

  const handleCreateTryOn = React.useCallback(async () => {
    if (!token) {
      showToast("Please sign in to use virtual try-on", "info");
      router.push("/login");
      return;
    }
    if (!isConnected) {
      showToast("You're offline. Please check your connection.", "error");
      return;
    }
    if (!product || !fallbackVariant) {
      setTryOnError("Select a product variant first.");
      return;
    }
    if (!tryOnUserImageAsset) {
      setTryOnError("Take or upload your photo first.");
      return;
    }

    tryOnAbortRef.current?.abort();
    const controller = new AbortController();
    tryOnAbortRef.current = controller;
    setTryOnLoading(true);
    setTryOnError(null);

    try {
      const uploadedUserImageUrl = await uploadTryOnImage(tryOnUserImageAsset);
      const result = await createVirtualTryOn({
        productId: product.id,
        variantId: fallbackVariant.id,
        userImage: uploadedUserImageUrl,
        signal: controller.signal,
      });
      if (!mountedRef.current) return;
      setTryOnResult(result);
      setIsTryOnVisible(true);
      notifySuccess();
    } catch (err) {
      if (!mountedRef.current || isAbortError(err)) return;
      const msg = err instanceof Error ? err.message : "Virtual try-on failed";
      setTryOnError(msg);
      showToast(msg, "error");
    } finally {
      if (mountedRef.current) setTryOnLoading(false);
    }
  }, [
    token,
    isConnected,
    product,
    fallbackVariant,
    tryOnUserImageAsset,
    router,
    showToast,
  ]);

  // ---- Gallery scroll handler ----
  const handleGalleryScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offset / galleryWidth);
      setGalleryIndex(idx);
    },
    [galleryWidth]
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
        <GalleryImage uri={item} width={galleryWidth} height={galleryHeight} />
      </Pressable>
    ),
    [galleryHeight, galleryWidth, openImageViewer]
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
            width={galleryWidth}
            height={galleryHeight}
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
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: stickyReserveSpace }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Image gallery with paging dots ---- */}
        <View style={styles.galleryFrame}>
          <FlatList
            data={images}
            keyExtractor={galleryKeyExtractor}
            horizontal
            pagingEnabled
            snapToInterval={galleryWidth}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={handleGalleryScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.galleryContainer}
            getItemLayout={(_data, index) => ({
              length: galleryWidth,
              offset: galleryWidth * index,
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
          <Text style={styles.categoryLabel}>
            {product.category?.name ?? "Curated Collection"}
          </Text>

          <View style={styles.titleRow}>
            <Text style={styles.productTitle}>{product.title}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Pressable
                  onPress={() => {
                    if (!token) {
                      router.push("/login");
                      return;
                    }
                    impactLight();
                    toggleWishlist(product.id);
                  }}
                  disabled={!product || wishlistMutatingIds.has(product?.id ?? "")}
                  style={styles.wishlistInlineButton}
                  hitSlop={8}
                >
                  <WishlistIcon
                    size={22}
                    color={isWishlisted(product.id) ? "#E8453C" : colors.charcoal}
                    filled={isWishlisted(product.id)}
                  />
                </Pressable>

                <Pressable
                  onPress={() => {
                    impactLight();
                    void handleShareProduct();
                  }}
                  style={styles.shareInlineButton}
                  hitSlop={8}
                >
                  <Ionicons name="share-social-outline" size={20} color={colors.charcoal} />
                </Pressable>
              </View>
          </View>

          <View style={styles.detailsTopRow}>
            <View style={styles.detailsBadge}>
              <Text style={styles.detailsBadgeText}>Luxury Edit</Text>
            </View>
            <Text style={styles.skuText}>
              SKU ID- {fallbackVariant?.sku ?? "N/A"}
            </Text>
          </View>

          {/* Rating pill — uses real reviews when present, otherwise seeded values */}
          <View style={styles.ratingPillRow}>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillStar}>★</Text>
              <Text style={styles.ratingPillValue}>
                {(reviews.length > 0 ? avgRating : productRating).toFixed(1)}
              </Text>
              <Text style={styles.ratingPillDivider}>|</Text>
              <Text style={styles.ratingPillCount}>
                {reviews.length > 0 ? reviews.length : productReviewCount}
              </Text>
            </View>
            <Text style={styles.ratingPillLabel}>
              {reviews.length > 0
                ? `${reviews.length === 1 ? "review" : "reviews"}`
                : "ratings"}
            </Text>
          </View>

          {(() => {
            const paragraphs = htmlToParagraphs(
              product.description ?? "Curated premium listing with verified quality assurance."
            );
            return (
              <View style={styles.descriptionWrap}>
                {paragraphs.map((para, idx) => (
                  <Text key={`desc-${idx}`} style={styles.productDescription}>
                    {para}
                  </Text>
                ))}
              </View>
            );
          })()}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>MRP (Inclusive of all taxes)</Text>
            <View style={styles.priceValues}>
              <Text style={styles.priceValue}>
                {typeof salePrice === "number" ? currency.format(salePrice) : "—"}
              </Text>
              {hasDiscount && (
                  <Text style={styles.comparePrice}>
                    {currency.format(compareAtPrice)}
                  </Text>
                )}
              {hasDiscount ? (
                <View style={styles.discountPill}>
                  <Text style={styles.discountPillText}>{discountPercent}% OFF</Text>
                </View>
              ) : null}
            </View>
            {hasDiscount ? (
              <Text style={styles.savingsText}>
                You save {currency.format(savingsAmount)} + limited-time offer
              </Text>
            ) : null}
          </View>

          {/* Delivery + offers + viewer count */}
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={16} color={colors.gold} />
              <Text style={styles.infoText}>
                Get it by <Text style={styles.infoStrong}>{deliveryEstimate}</Text>
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={16} color={colors.gold} />
              <Text style={styles.infoText}>
                Use <Text style={styles.infoStrong}>WELCOME5</Text> for extra 5% off on first order
              </Text>
            </View>
            {productSeed ? (
              <View style={styles.infoRow}>
                <Ionicons name="eye-outline" size={16} color={colors.brownSoft} />
                <Text style={styles.infoTextMuted}>
                  {productViewerCount} people viewed this recently
                </Text>
              </View>
            ) : null}
          </View>

          {/* Trust strip */}
          <View style={styles.trustStrip}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.gold} />
              <Text style={styles.trustText}>Authentic</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="refresh-outline" size={14} color={colors.gold} />
              <Text style={styles.trustText}>7-Day Returns</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="airplane-outline" size={14} color={colors.gold} />
              <Text style={styles.trustText}>Pan-India</Text>
            </View>
          </View>

          {/* Stock indicator */}
          {fallbackVariant?.inventory != null && (
            <Text
              style={[
                styles.stockText,
                outOfStock && styles.stockTextOut,
              ]}
            >
              {outOfStock
                ? "Out of stock"
                : fallbackVariant.inventory.stock <= 5
                  ? `Only ${fallbackVariant.inventory.stock} left`
                  : "In stock"}
            </Text>
          )}

          {/* Variant selector */}
          <View style={styles.variantRow}>
            <Text style={styles.variantLabel}>Select Color</Text>
            <View style={styles.variantWrap}>
              {colorOptions.length ? (
                colorOptions.map((color) => {
                  const active = selectedColor === color.key;
                  const swatchSize = isCompactLayout ? 26 : 30;
                  return (
                    <Pressable
                      key={color.key}
                      style={[
                        styles.colorOption,
                        active && styles.colorOptionActive,
                      ]}
                      onPress={() => {
                        setSelectedColor(color.key);
                        const firstVariant = (product?.variants ?? []).find(
                          (variant) => normalizeColor(getVariantColorLabel(variant)) === color.key,
                        );
                        if (firstVariant) {
                          setSelectedVariantId(firstVariant.id);
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.colorSwatch,
                          {
                            width: swatchSize,
                            height: swatchSize,
                            backgroundColor: swatchColorFromLabel(color.label),
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.colorOptionText,
                          active && styles.colorOptionTextActive,
                        ]}
                      >
                        {color.label}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={styles.mutedText}>Colors coming soon.</Text>
              )}
            </View>
          </View>

          <View style={styles.variantRow}>
            <Text style={styles.variantLabel}>Select Size</Text>
            <View style={styles.variantWrap}>
              {variantsForColor.length ? (
                variantsForColor.map((variant: ProductVariant) => {
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
                        {getVariantSizeLabel(variant)}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={styles.mutedText}>Variants coming soon.</Text>
              )}
            </View>
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

        <View style={styles.tryOnCard}>
          <View style={styles.tryOnHeader}>
            <View>
              <Text style={styles.tryOnEyebrow}>Virtual Try-On</Text>
              <Text style={styles.tryOnTitle}>See it on you</Text>
            </View>
            {tryOnResult?.output?.[0] ? (
              <Pressable onPress={() => setIsTryOnVisible(true)} hitSlop={8}>
                <Text style={styles.tryOnViewText}>View result</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.tryOnPreviewRow}>
            <View style={styles.tryOnPreviewBox}>
              {tryOnUserImageUri ? (
                <Image
                  source={{ uri: tryOnUserImageUri }}
                  style={styles.tryOnPreviewImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.tryOnPlaceholderText}>Your photo</Text>
              )}
            </View>
            <View style={styles.tryOnPreviewBox}>
              <Image
                source={{ uri: selectedColorImages[0] ?? images[0] ?? fallbackImage }}
                style={styles.tryOnPreviewImage}
                contentFit="cover"
              />
            </View>
          </View>

          <View style={styles.tryOnActions}>
            <Pressable
              style={styles.tryOnButton}
              onPress={handleCaptureTryOnPhoto}
              disabled={tryOnLoading}
            >
              <Text style={styles.tryOnButtonText}>Camera</Text>
            </Pressable>
            <Pressable
              style={styles.tryOnButton}
              onPress={handlePickTryOnPhoto}
              disabled={tryOnLoading}
            >
              <Text style={styles.tryOnButtonText}>Upload</Text>
            </Pressable>
          </View>

          {tryOnError ? <Text style={styles.errorText}>{tryOnError}</Text> : null}

          <AnimatedPressable
            style={[
              styles.primaryButton,
              (!tryOnUserImageAsset || tryOnLoading) && styles.buttonDisabled,
            ]}
            onPress={handleCreateTryOn}
            disabled={!tryOnUserImageAsset || tryOnLoading}
          >
            {tryOnLoading ? (
              <TatvivahLoader size="sm" color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>Try this product</Text>
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

      <View
        style={[
          styles.stickyActionShell,
          {
            bottom: Platform.OS === "web" ? 0 : stickyBottomOffset,
            paddingBottom: Platform.OS === "web"
              ? spacing.md
              : Math.max(insets.bottom, spacing.xs),
          },
        ]}
      >
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <AnimatedPressable
              style={[
                styles.ctaButtonBase,
                styles.addToCartButton,
                (outOfStock || adding) && styles.buttonDisabled,
              ]}
              onPress={handleAddToCart}
              disabled={outOfStock || adding}
              hitSlop={10}
            >
              {adding ? (
                <TatvivahLoader size="sm" color={colors.charcoal} />
              ) : (
                <>
                  <Ionicons name="bag-handle-outline" size={15} color="#1A1410" />
                  <Text style={[styles.ctaButtonText, styles.addToCartButtonText]}>
                    {!selectedVariant
                      ? "Select variant"
                      : outOfStock
                        ? "Out of stock"
                        : "Add to bag"}
                  </Text>
                </>
              )}
            </AnimatedPressable>
          </View>

          <View style={{ flex: 1 }}>
            <AnimatedPressable
              style={[
                styles.ctaButtonBase,
                styles.buyNowButton,
                (outOfStock || adding) && styles.buttonDisabled,
              ]}
              onPress={handleBuyNow}
              disabled={outOfStock || adding}
            >
              {adding ? (
                <TatvivahLoader size="sm" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.ctaButtonText}>Buy now</Text>
                </>
              )}
            </AnimatedPressable>
          </View>
        </View>
      </View>

      <Modal
        visible={isViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.viewerOverlay}>
          <Pressable
            style={[styles.viewerCloseButton, { top: insets.top + spacing.md }]}
            onPress={closeImageViewer}
          >
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
              length: viewerWidth,
              offset: viewerWidth * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const next = Math.round(
                e.nativeEvent.contentOffset.x / viewerWidth
              );
              setViewerIndex(next);
            }}
          />

          <Text style={styles.viewerHintText}>
            {viewerIndex + 1}/{images.length} • Pinch/Double tap • Drag down to close
          </Text>
        </View>
      </Modal>

      <Modal
        visible={isTryOnVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTryOnVisible(false)}
      >
        <View style={styles.tryOnModalOverlay}>
          <View style={styles.tryOnModalContent}>
            <Pressable
              style={styles.tryOnModalClose}
              onPress={() => setIsTryOnVisible(false)}
            >
              <Text style={styles.viewerCloseText}>Close</Text>
            </Pressable>
            {tryOnResult?.output?.[0] ? (
              <Image
                source={{ uri: tryOnResult.output[0] }}
                style={styles.tryOnResultImage}
                contentFit="contain"
              />
            ) : null}
          </View>
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
    backgroundColor: colors.background,
  },
  titleRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  detailsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.xs,
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
    fontFamily: typography.serif,
    flex: 1,
    fontSize: 26,
    color: colors.charcoal,
    lineHeight: 30,
  },
  wishlistInlineButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  shareInlineButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.sm,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F8A5F",
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  ratingPillStar: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 13,
  },
  ratingPillValue: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  ratingPillDivider: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  ratingPillCount: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: "rgba(255,255,255,0.95)",
  },
  ratingPillLabel: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  descriptionWrap: {
    marginTop: spacing.sm,
    gap: 8,
  },
  productDescription: {
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brownSoft,
  },
  infoBlock: {
    marginTop: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.cream,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.charcoal,
    flex: 1,
    lineHeight: 16,
  },
  infoTextMuted: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    flex: 1,
    lineHeight: 16,
  },
  infoStrong: {
    fontFamily: typography.sansMedium,
    fontWeight: "700",
    color: colors.charcoal,
  },
  trustStrip: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    justifyContent: "center",
  },
  trustText: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.charcoal,
    fontWeight: "600",
  },
  trustDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.borderSoft,
  },
  priceRow: {
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingBottom: spacing.md,
  },
  priceLabel: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  priceValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  priceValue: {
    fontFamily: typography.serif,
    fontSize: 34,
    color: colors.charcoal,
  },
  comparePrice: {
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.brownSoft,
    textDecorationLine: "line-through",
  },
  discountPill: {
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "rgba(196, 167, 108, 0.12)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  discountPillText: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  savingsText: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
  colorOption: {
    width: 72,
    alignItems: "center",
    gap: 6,
  },
  colorOptionActive: {
    opacity: 1,
  },
  colorSwatch: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 999,
  },
  colorOptionText: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    width: "100%",
    textAlign: "center",
    lineHeight: 12,
  },
  colorOptionTextActive: {
    color: colors.charcoal,
    fontFamily: typography.sansMedium,
  },

  // Virtual try-on
  tryOnCard: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceElevated,
  },
  tryOnHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  tryOnEyebrow: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  tryOnTitle: {
    marginTop: 2,
    fontFamily: typography.serif,
    fontSize: 22,
    lineHeight: 26,
    color: colors.charcoal,
  },
  tryOnViewText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tryOnPreviewRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tryOnPreviewBox: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tryOnPreviewImage: {
    width: "100%",
    height: "100%",
  },
  tryOnPlaceholderText: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tryOnActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tryOnButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
    paddingVertical: 12,
    alignItems: "center",
  },
  tryOnButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.charcoal,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tryOnModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 18, 16, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  tryOnModalContent: {
    width: "100%",
    height: "86%",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  tryOnModalClose: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    backgroundColor: "rgba(44, 40, 37, 0.72)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tryOnResultImage: {
    width: "100%",
    height: "100%",
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
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    width: "100%",
  },
  ctaButtonBase: {
    flex: 1,
    minHeight: 50,
    marginTop: 0,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 0,
  },
  addToCartButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#1A1410",
  },
  addToCartButtonText: {
    color: "#1A1410",
    fontWeight: "700",
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.background,
  },
  ctaButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#FFFFFF",
    fontWeight: "700",
  },
  buyNowButton: {
    backgroundColor: "#1A1410",
    borderWidth: 1.5,
    borderColor: "#1A1410",
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
  stickyActionShell: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 12,
    elevation: 16,
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "#FFFFFF",
    shadowColor: "#1A1410",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 12,
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
  skuText: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.brownSoft,
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
