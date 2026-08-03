import * as React from "react";
import { View, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, typography } from "../theme/tokens";
import { getProductById, type ProductVariant } from "../services/products";
import { useCart } from "../providers/CartProvider";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../providers/ToastProvider";
import { PRODUCT_QUERY_STALE_TIME_MS } from "../lib/prefetch-product";
import { Image } from "./CompatImage";
import { TatvivahLoader } from "./TatvivahLoader";
import { AppText as Text } from "./index";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export type QuickBuyIntent = "cart" | "buy";

const inStock = (variant: ProductVariant) => (variant.inventory?.stock ?? 0) > 0;

/**
 * Buy without leaving the list.
 *
 * The list endpoint does not return variants, so a card cannot know what sizes
 * exist. This sheet reads the product from the react-query cache the card
 * already prefetched on press — usually instant — and only asks for the one
 * thing that genuinely cannot be guessed: which size. A product with a single
 * variant skips even that.
 */
export function QuickBuySheet({
  productId,
  intent,
  visible,
  onClose,
}: {
  productId: string | null;
  intent: QuickBuyIntent;
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { session } = useAuth();
  const { showToast } = useToast();

  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: ({ signal }) => getProductById(productId as string, signal),
    enabled: Boolean(productId) && visible,
    staleTime: PRODUCT_QUERY_STALE_TIME_MS,
  });

  const product = productQuery.data?.product ?? null;
  const variants = React.useMemo<ProductVariant[]>(
    () => (product?.variants ?? []).filter(inStock),
    [product]
  );

  const colors_ = React.useMemo(() => {
    const map = new Map<string, { label: string; hex: string | null }>();
    for (const variant of variants) {
      const label = variant.color?.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          label,
          hex: (variant as { colorHex?: string | null }).colorHex ?? null,
        });
      }
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }));
  }, [variants]);

  const sizesForColor = React.useMemo(() => {
    if (!selectedColor) return variants;
    return variants.filter(
      (variant) => (variant.color ?? "").toLowerCase() === selectedColor
    );
  }, [variants, selectedColor]);

  // Preselect whatever is unambiguous, so a single-variant product needs no taps.
  React.useEffect(() => {
    if (!visible) return;
    if (variants.length === 0) return;

    if (colors_.length === 1 && !selectedColor) {
      setSelectedColor(colors_[0].key);
    }
    if (variants.length === 1) {
      setSelectedVariantId(variants[0].id);
      return;
    }
    if (sizesForColor.length === 1) {
      setSelectedVariantId(sizesForColor[0].id);
    }
  }, [visible, variants, colors_, selectedColor, sizesForColor]);

  React.useEffect(() => {
    if (visible) return;
    setSelectedColor(null);
    setSelectedVariantId(null);
    setSubmitting(false);
  }, [visible]);

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const heroImage =
    selectedVariant?.images?.[0] ??
    (typeof product?.images?.[0] === "string"
      ? (product.images[0] as unknown as string)
      : (product?.images?.[0] as { url?: string } | undefined)?.url) ??
    null;

  const handleConfirm = React.useCallback(async () => {
    if (!productId || !selectedVariant || submitting) return;

    if (!session?.accessToken) {
      onClose();
      router.push("/login?returnTo=%2Fcart");
      return;
    }

    setSubmitting(true);
    try {
      await addToCart({
        productId,
        variantId: selectedVariant.id,
        quantity: 1,
      });
      onClose();
      // Straight to where the shopper is heading — no product page detour.
      router.push(
        intent === "buy"
          ? `/checkout?buyNowVariantId=${encodeURIComponent(selectedVariant.id)}`
          : "/cart"
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not add to bag",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    productId,
    selectedVariant,
    submitting,
    session?.accessToken,
    addToCart,
    intent,
    onClose,
    router,
    showToast,
  ]);

  const loading = productQuery.isLoading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.grabber} />

          {loading ? (
            <View style={styles.loadingWrap}>
              <TatvivahLoader size="sm" color={colors.gold} />
            </View>
          ) : !product ? (
            <Text style={styles.emptyText}>Could not load this product.</Text>
          ) : variants.length === 0 ? (
            <Text style={styles.emptyText}>This product is out of stock.</Text>
          ) : (
            <>
              <View style={styles.header}>
                {heroImage ? (
                  <Image
                    source={{ uri: heroImage }}
                    style={styles.heroImage}
                    contentFit="cover"
                    width={80}
                  />
                ) : null}
                <View style={styles.headerText}>
                  <Text style={styles.title} numberOfLines={2}>
                    {product.title}
                  </Text>
                  <Text style={styles.price}>
                    {currency.format(selectedVariant?.price ?? product.price ?? 0)}
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Ionicons name="close" size={22} color={colors.charcoal} />
                </Pressable>
              </View>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {colors_.length > 1 ? (
                  <>
                    <Text style={styles.sectionLabel}>Colour</Text>
                    <View style={styles.chipRow}>
                      {colors_.map((color) => {
                        const active = color.key === selectedColor;
                        return (
                          <Pressable
                            key={color.key}
                            onPress={() => {
                              setSelectedColor(color.key);
                              setSelectedVariantId(null);
                            }}
                            style={[styles.colorChip, active && styles.chipActive]}
                          >
                            {color.hex ? (
                              <View
                                style={[styles.dot, { backgroundColor: color.hex }]}
                              />
                            ) : null}
                            <Text
                              style={[
                                styles.chipText,
                                active && styles.chipTextActive,
                              ]}
                            >
                              {color.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                {sizesForColor.length > 1 ? (
                  <>
                    <Text style={styles.sectionLabel}>Size</Text>
                    <View style={styles.chipRow}>
                      {sizesForColor.map((variant) => {
                        const active = variant.id === selectedVariantId;
                        return (
                          <Pressable
                            key={variant.id}
                            onPress={() => setSelectedVariantId(variant.id)}
                            style={[styles.sizeChip, active && styles.chipActive]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                active && styles.chipTextActive,
                              ]}
                            >
                              {variant.size}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}
              </ScrollView>

              <Pressable
                style={[
                  styles.cta,
                  (!selectedVariant || submitting) && styles.ctaDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!selectedVariant || submitting}
              >
                <Text style={styles.ctaText}>
                  {submitting
                    ? "Adding…"
                    : !selectedVariant
                      ? "Select a size"
                      : intent === "buy"
                        ? "Buy Now"
                        : "Add to Bag"}
                </Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20,18,16,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    maxHeight: "80%",
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 4,
    backgroundColor: colors.borderSoft,
    marginBottom: spacing.md,
  },
  loadingWrap: { paddingVertical: spacing.xl, alignItems: "center" },
  emptyText: {
    paddingVertical: spacing.xl,
    textAlign: "center",
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.brownSoft,
  },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroImage: {
    width: 64,
    height: 80,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.cream,
  },
  headerText: { flex: 1 },
  title: { fontFamily: typography.serif, fontSize: 17, color: colors.charcoal },
  price: {
    marginTop: 4,
    fontFamily: typography.sansMedium,
    fontSize: 16,
    color: colors.charcoal,
  },
  body: { marginTop: spacing.lg },
  sectionLabel: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.brownSoft,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  colorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  sizeChip: {
    minWidth: 52,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  chipActive: { borderColor: colors.gold, backgroundColor: colors.cream },
  chipText: { fontFamily: typography.sans, fontSize: 13, color: colors.brownSoft },
  chipTextActive: { color: colors.charcoal },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.borderSoft },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: colors.charcoal,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: {
    fontFamily: typography.sansMedium,
    fontSize: 14,
    letterSpacing: 1,
    color: colors.warmWhite,
  },
});
