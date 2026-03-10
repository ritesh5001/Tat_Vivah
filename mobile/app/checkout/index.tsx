import * as React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../src/theme/tokens";
import { checkout, validateCoupon, type CouponPreview } from "../../src/services/cart";
import { initiatePayment, verifyPayment } from "../../src/services/payments";
import { isRazorpayAvailable, openRazorpayCheckout } from "../../src/services/razorpay";
import { ApiError } from "../../src/services/api";
import { useAuth } from "../../src/hooks/useAuth";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";
import { useCart } from "@/src/providers/CartProvider";
import { useAddresses } from "../../src/providers/AddressProvider";
import { useToast } from "../../src/providers/ToastProvider";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { notifySuccess, notifyError, impactLight } from "../../src/utils/haptics";
import { AppHeader } from "../../src/components/AppHeader";
import type { Address } from "../../src/services/addresses";
import { TatvivahLoader, TatvivahOverlayLoader } from "../../src/components/TatvivahLoader";
import {
  AppInput as TextInput,
  AppText as Text,
  ScreenContainer as SafeAreaView,
} from "../../src/components";

// ---------------------------------------------------------------------------
// Address selector row — memoized for FlatList
// ---------------------------------------------------------------------------

interface SelectorRowProps {
  item: Address;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const AddressSelectorRow = React.memo(function AddressSelectorRow({
  item,
  isSelected,
  onSelect,
}: SelectorRowProps) {
  return (
    <AnimatedPressable
      style={[styles.selectorRow, isSelected && styles.selectorRowSelected]}
      onPress={() => onSelect(item.id)}
    >
      <View style={styles.selectorRadio}>
        {isSelected && <View style={styles.selectorRadioInner} />}
      </View>
      <View style={styles.selectorContent}>
        <View style={styles.selectorBadgeRow}>
          <Text style={styles.selectorLabel}>{item.label}</Text>
          {item.isDefault && (
            <Text style={styles.selectorDefault}>Default</Text>
          )}
        </View>
        <Text style={styles.selectorLine}>
          {item.addressLine1}
          {item.addressLine2 ? `, ${item.addressLine2}` : ""}
        </Text>
        <Text style={styles.selectorLine}>
          {item.city}, {item.state} — {item.pincode}
        </Text>
      </View>
    </AnimatedPressable>
  );
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CheckoutScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading: authLoading } = useAuth();
  const token = session?.accessToken ?? null;
  const { isConnected } = useNetworkStatus();
  const { clearCart, refreshCart, cartItems } = useCart();
  const { addresses, defaultAddress, isLoading: addressesLoading } = useAddresses();
  const { showToast } = useToast();

  // ---------- Payment guard — prevents double-submit ----------
  const [isPaying, setIsPaying] = React.useState(false);
  const [payLabel, setPayLabel] = React.useState("Starting payment");
  const [error, setError] = React.useState<string | null>(null);
  const [taxSummary, setTaxSummary] = React.useState<{
    subTotalAmount: number;
    totalTaxAmount: number;
    grandTotal: number;
    discountAmount: number;
  } | null>(null);
  const mountedRef = React.useRef(true);

  // ---------- Coupon state ----------
  const [couponCode, setCouponCode] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<CouponPreview | null>(null);
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const cartFingerprintRef = React.useRef("");

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------- Address selection ----------
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = React.useState(false);

  // Auto-select default address when addresses load
  React.useEffect(() => {
    if (!selectedAddressId && defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [selectedAddressId, defaultAddress]);

  const selectedAddress = React.useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  // ---------- Fallback manual shipping fields (if no addresses) ----------
  const [shipping, setShipping] = React.useState({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    notes: "",
  });

  const hasAddresses = addresses.length > 0;
  const cartSubtotal = React.useMemo(
    () => cartItems.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0),
    [cartItems]
  );
  const shippingFee = cartItems.length ? 180 : 0;
  const displaySubtotal = taxSummary?.subTotalAmount ?? cartSubtotal;
  const displayDiscount = taxSummary?.discountAmount ?? 0;
  const displayGst = taxSummary?.totalTaxAmount ?? 0;
  const computedGrandTotal = displaySubtotal - displayDiscount + shippingFee + displayGst;
  const displayGrandTotal =
    typeof taxSummary?.grandTotal === "number"
      ? Math.max(taxSummary.grandTotal, computedGrandTotal)
      : computedGrandTotal;

  // ---------- Clear coupon when cart items change ----------
  React.useEffect(() => {
    const fp = cartItems.map((i) => `${i.variantId}:${i.quantity}`).sort().join("|");
    if (cartFingerprintRef.current && cartFingerprintRef.current !== fp) {
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError(null);
    }
    cartFingerprintRef.current = fp;
  }, [cartItems]);

  // Redirect if cart is empty (navigated directly, or cart cleared)
  React.useEffect(() => {
    if (!authLoading && cartItems.length === 0 && !isPaying) {
      // Don't redirect while a payment is in-flight
      // Cart will be empty after successful checkout → we navigate from handleCheckout
    }
  }, [authLoading, cartItems.length, isPaying]);

  React.useEffect(() => {
    if (!authLoading && !token) {
      const returnTo = encodeURIComponent(pathname || "/checkout");
      router.replace(`/login?returnTo=${returnTo}`);
    }
  }, [authLoading, token, pathname, router]);

  // ---- Address modal handlers ----

  const openAddressModal = React.useCallback(() => {
    impactLight();
    setShowAddressModal(true);
  }, []);

  const closeAddressModal = React.useCallback(() => {
    setShowAddressModal(false);
  }, []);

  const handleSelectAddress = React.useCallback((id: string) => {
    impactLight();
    setSelectedAddressId(id);
    setShowAddressModal(false);
  }, []);

  const navigateToAddAddress = React.useCallback(() => {
    setShowAddressModal(false);
    router.push("/profile/addresses/form");
  }, [router]);

  // ---- Coupon handlers ----

  const handleApplyCoupon = React.useCallback(async () => {
    const trimmed = couponCode.trim();
    if (!trimmed || !token) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const result = await validateCoupon(trimmed, token);
      if (result.valid && result.coupon) {
        // Client-side min-order hint (backend is source of truth at checkout)
        const subtotal = cartItems.reduce(
          (sum, i) => sum + i.priceSnapshot * i.quantity,
          0
        );
        if (
          result.coupon.minOrderAmount !== null &&
          subtotal < result.coupon.minOrderAmount
        ) {
          setCouponError(
            `Minimum order of ₹${result.coupon.minOrderAmount} required`
          );
          setCouponLoading(false);
          return;
        }

        setAppliedCoupon(result.coupon);
        setCouponError(null);
        impactLight();
      } else {
        setCouponError(result.message ?? "Invalid coupon code");
        notifyError();
      }
    } catch (err) {
      setCouponError(
        err instanceof Error ? err.message : "Could not validate coupon"
      );
      notifyError();
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, token, cartItems]);

  const handleRemoveCoupon = React.useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
    impactLight();
  }, []);

  // ---- Checkout handler ----

  const handleCheckout = async () => {
    // --- Guard: prevent double submit ---
    if (isPaying) return;
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!isConnected) {
      Alert.alert(
        "No connection",
        "You appear to be offline. Please reconnect before completing your order."
      );
      return;
    }
    if (cartItems.length === 0) {
      showToast("Your cart is empty.", "info");
      return;
    }
    if (!isRazorpayAvailable()) {
      showToast(
        "Razorpay is unavailable in Expo Go. Use a development build to test payments.",
        "error"
      );
      setError("Razorpay SDK is not available in Expo Go. Please use a development build.");
      return;
    }

    // Build shipping payload from selected address or manual fields
    const shippingPayload = selectedAddress
      ? {
          shippingAddressLine1: selectedAddress.addressLine1,
          shippingAddressLine2: selectedAddress.addressLine2 || undefined,
          shippingCity: selectedAddress.city,
          couponCode: appliedCoupon?.code || undefined,
        }
      : {
          shippingName: shipping.name || undefined,
          shippingPhone: shipping.phone || undefined,
          shippingEmail: shipping.email || undefined,
          shippingAddressLine1: shipping.addressLine1 || undefined,
          shippingAddressLine2: shipping.addressLine2 || undefined,
          shippingCity: shipping.city || undefined,
          shippingNotes: shipping.notes || undefined,
          couponCode: appliedCoupon?.code || undefined,
        };

    setPayLabel("Creating order");
    setIsPaying(true);
    setError(null);

    let createdOrderId: string | null = null;
    try {
      // 1. Create order via checkout
      const orderResult = await checkout(shippingPayload, token);

      const orderId = orderResult.order?.id;
      if (!orderId) {
        throw new Error("Order ID missing. Please try again.");
      }
      createdOrderId = orderId;

      // Store GST summary from backend response
      if (orderResult.order && mountedRef.current) {
        const toNumber = (value: number | string | null | undefined) =>
          typeof value === "string" ? Number(value) : value ?? 0;
        setTaxSummary({
          subTotalAmount: toNumber(orderResult.order.subTotalAmount),
          totalTaxAmount: toNumber(orderResult.order.totalTaxAmount),
          grandTotal: toNumber(orderResult.order.grandTotal),
          discountAmount: toNumber(orderResult.order.discountAmount),
        });
      }

      // 2. Initiate Razorpay payment
      const payment = await initiatePayment(orderId, token);
      const { key, orderId: razorpayOrderId, amount, currency } = payment.data;

      // 3. Open Razorpay native checkout
      const prefillName = shipping.name || undefined;
      const prefillContact = shipping.phone || undefined;
      const prefillEmail = shipping.email || undefined;

      setPayLabel("Opening Razorpay");
      const razorpayResult = await openRazorpayCheckout({
        key,
        amount,
        currency,
        name: "TatVivah",
        description: "Order Payment",
        order_id: razorpayOrderId,
        theme: { color: "#B8956C" },
        prefill: {
          name: prefillName,
          email: prefillEmail,
          contact: prefillContact,
        },
      });

      // 4. Verify payment on backend — CRITICAL: do NOT navigate before this
      setPayLabel("Verifying payment");
      await verifyPayment(
        {
          razorpayOrderId: razorpayResult.razorpay_order_id,
          razorpayPaymentId: razorpayResult.razorpay_payment_id,
          razorpaySignature: razorpayResult.razorpay_signature,
        },
        token
      );

      // 5. ONLY after verification success: clear cart + navigate
      if (mountedRef.current) {
        notifySuccess();
        clearCart();
        // Refresh to sync server state (cart should now be empty)
        refreshCart();
        router.replace(`/orders/${orderId}`);
      }
    } catch (err) {
      if (!mountedRef.current) return; // Component unmounted during payment

      const rawMessage = err instanceof Error ? err.message : "";
      const wasDismissedByUser = /cancel|dismiss|closed|backpress|back press/i.test(
        rawMessage
      );

      if (wasDismissedByUser) {
        showToast("Payment pending. You can retry from orders.", "info");
        router.replace("/orders");
        setError(null);
        return;
      }

      const lowered = rawMessage.toLowerCase();
      const isRazorpayMissing =
        lowered.includes("razorpay") || lowered.includes("open") || lowered.includes("sdk");
      const message = isRazorpayMissing
        ? "Razorpay SDK is not available. Install it and rebuild the app."
        : err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Payment failed. Please try again.";
      setError(message);
      notifyError();
      showToast(message, "error");

      if (createdOrderId) {
        showToast("Order created. Payment pending — retry from orders.", "info");
        router.replace(`/orders/${createdOrderId}`);
      }
    } finally {
      if (mountedRef.current) {
        setIsPaying(false);
        setPayLabel("Starting payment");
      }
    }
  };

  const isButtonDisabled =
    isPaying ||
    !isConnected ||
    cartItems.length === 0 ||
    (hasAddresses && !selectedAddressId);

  // ---- Selector key ----
  const selectorKeyExtractor = React.useCallback(
    (item: Address) => item.id,
    [],
  );

  const renderSelectorItem = React.useCallback(
    ({ item }: { item: Address }) => (
      <AddressSelectorRow
        item={item}
        isSelected={item.id === selectedAddressId}
        onSelect={handleSelectAddress}
      />
    ),
    [selectedAddressId, handleSelectAddress],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Checkout" subtitle="Secure payment" showMenu showBack />
      {isPaying ? (
        <TatvivahOverlayLoader label={payLabel} />
      ) : null}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>
          Confirm delivery address and complete your order.
        </Text>

        {/* ---- Address section ---- */}
        {hasAddresses ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>

            {selectedAddress ? (
              <View style={styles.selectedAddressBox}>
                <View style={styles.selectedBadgeRow}>
                  <Text style={styles.selectorLabel}>
                    {selectedAddress.label}
                  </Text>
                  {selectedAddress.isDefault && (
                    <Text style={styles.selectorDefault}>Default</Text>
                  )}
                </View>
                <Text style={styles.selectedLine}>
                  {selectedAddress.addressLine1}
                  {selectedAddress.addressLine2
                    ? `, ${selectedAddress.addressLine2}`
                    : ""}
                </Text>
                <Text style={styles.selectedLine}>
                  {selectedAddress.city}, {selectedAddress.state} —{" "}
                  {selectedAddress.pincode}
                </Text>
              </View>
            ) : (
              <Text style={styles.noAddressHint}>
                Select a delivery address to continue.
              </Text>
            )}

            <AnimatedPressable
              style={styles.changeButton}
              onPress={openAddressModal}
              disabled={isPaying}
            >
              <Text style={styles.changeButtonText}>
                {selectedAddress ? "Change address" : "Select address"}
              </Text>
            </AnimatedPressable>
          </View>
        ) : (
          /* ---- Fallback manual fields (no saved addresses) ---- */
          <View style={styles.card}>
            <View style={styles.noAddressCta}>
              <Text style={styles.noAddressCtaText}>
                Save addresses for faster checkout
              </Text>
              <AnimatedPressable
                style={styles.addAddressButton}
                onPress={navigateToAddAddress}
              >
                <Text style={styles.addAddressButtonText}>+ Add address</Text>
              </AnimatedPressable>
            </View>

            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Aarav Sharma"
              placeholderTextColor={colors.brownSoft}
              value={shipping.name}
              onChangeText={(value) =>
                setShipping((prev) => ({ ...prev, name: value }))
              }
              editable={!isPaying}
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.brownSoft}
              keyboardType="phone-pad"
              value={shipping.phone}
              onChangeText={(value) =>
                setShipping((prev) => ({ ...prev, phone: value }))
              }
              editable={!isPaying}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor={colors.brownSoft}
              autoCapitalize="none"
              value={shipping.email}
              onChangeText={(value) =>
                setShipping((prev) => ({ ...prev, email: value }))
              }
              editable={!isPaying}
            />

            <Text style={styles.label}>Address line 1</Text>
            <TextInput
              style={styles.input}
              placeholder="House, street, area"
              placeholderTextColor={colors.brownSoft}
              value={shipping.addressLine1}
              onChangeText={(value) =>
                setShipping((prev) => ({ ...prev, addressLine1: value }))
              }
              editable={!isPaying}
            />

            <Text style={styles.label}>Address line 2</Text>
            <TextInput
              style={styles.input}
              placeholder="Apartment, landmark"
              placeholderTextColor={colors.brownSoft}
              value={shipping.addressLine2}
              onChangeText={(value) =>
                setShipping((prev) => ({ ...prev, addressLine2: value }))
              }
              editable={!isPaying}
            />

            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor={colors.brownSoft}
              value={shipping.city}
              onChangeText={(value) =>
                setShipping((prev) => ({ ...prev, city: value }))
              }
              editable={!isPaying}
            />
          </View>
        )}

        {/* ---- Notes (always visible) ---- */}
        <View style={[styles.card, { marginTop: spacing.md }]}>
          <Text style={styles.label}>Order notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 72, textAlignVertical: "top" }]}
            placeholder="Special instructions…"
            placeholderTextColor={colors.brownSoft}
            multiline
            value={shipping.notes}
            onChangeText={(value) =>
              setShipping((prev) => ({ ...prev, notes: value }))
            }
            editable={!isPaying}
          />
        </View>

        {/* ---- Coupon Card ---- */}
        <View style={[styles.card, { marginTop: spacing.md }]}>
          <Text style={styles.sectionTitle}>Promo Code</Text>

          {appliedCoupon ? (
            /* Applied state */
            <View style={styles.couponAppliedBox}>
              <View style={styles.couponAppliedLeft}>
                <Text style={styles.couponCheckmark}>✓</Text>
                <View>
                  <Text style={styles.couponAppliedCode}>{appliedCoupon.code}</Text>
                  <Text style={styles.couponAppliedDesc}>
                    {appliedCoupon.type === "PERCENT"
                      ? `${appliedCoupon.value}% off${
                          appliedCoupon.maxDiscountAmount !== null
                            ? ` (up to ₹${appliedCoupon.maxDiscountAmount})`
                            : ""
                        }`
                      : `₹${appliedCoupon.value} off`}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleRemoveCoupon}
                disabled={isPaying}
                hitSlop={12}
              >
                <Text style={styles.couponRemoveText}>REMOVE</Text>
              </Pressable>
            </View>
          ) : (
            /* Input state */
            <View style={styles.couponInputRow}>
              <TextInput
                style={[styles.input, styles.couponInput]}
                placeholder="Enter coupon code"
                placeholderTextColor={colors.brownSoft}
                autoCapitalize="characters"
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text.toUpperCase());
                  if (couponError) setCouponError(null);
                }}
                editable={!isPaying && !couponLoading}
                returnKeyType="done"
                onSubmitEditing={handleApplyCoupon}
              />
              <AnimatedPressable
                style={[
                  styles.couponApplyButton,
                  (couponLoading || !couponCode.trim()) && styles.buttonDisabled,
                ]}
                onPress={handleApplyCoupon}
                disabled={couponLoading || isPaying || !couponCode.trim()}
              >
                <Text style={styles.couponApplyText}>
                  {couponLoading ? "…" : "APPLY"}
                </Text>
              </AnimatedPressable>
            </View>
          )}

          {couponError ? (
            <Text style={styles.couponErrorText}>{couponError}</Text>
          ) : null}
        </View>

        {/* ---- Order Summary ---- */}
        <View style={[styles.card, { marginTop: spacing.md }]}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{displaySubtotal.toFixed(0)}</Text>
          </View>
          {displayDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.gold }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.gold }]}>−₹{displayDiscount.toFixed(0)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST</Text>
            <Text style={styles.summaryValue}>₹{displayGst.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>₹{shippingFee.toFixed(0)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft }]}>
            <Text style={[styles.summaryLabel, { fontFamily: typography.sansMedium, color: colors.charcoal }]}>Grand Total</Text>
            <Text style={[styles.summaryValue, { fontFamily: typography.serif, fontSize: 18, color: colors.charcoal }]}>₹{displayGrandTotal.toFixed(0)}</Text>
          </View>
        </View>

        {/* ---- CTA ---- */}
        <AnimatedPressable
          style={[
            styles.primaryButton,
            isButtonDisabled && styles.buttonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={isButtonDisabled}
          hitSlop={10}
        >
          {isPaying ? (
            <TatvivahLoader size="sm" color={colors.background} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {!isConnected
                ? "Offline"
                : cartItems.length === 0
                  ? "Cart is empty"
                  : hasAddresses && !selectedAddressId
                    ? "Select address"
                    : "Complete order"}
            </Text>
          )}
        </AnimatedPressable>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </ScrollView>

      {/* ---- Address selector modal ---- */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={closeAddressModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Address</Text>

            <FlatList
              data={addresses}
              keyExtractor={selectorKeyExtractor}
              renderItem={renderSelectorItem}
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.modalFooter}>
              <AnimatedPressable
                style={styles.addAddressButton}
                onPress={navigateToAddAddress}
              >
                <Text style={styles.addAddressButtonText}>
                  + Add new address
                </Text>
              </AnimatedPressable>
              <Pressable
                style={styles.modalCloseButton}
                onPress={closeAddressModal}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 28,
    color: colors.charcoal,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.brownSoft,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  sectionTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    fontFamily: typography.sans,
    color: colors.charcoal,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },

  // Selected address display
  selectedAddressBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  selectedBadgeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  selectedLine: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.charcoal,
    marginTop: 2,
    lineHeight: 19,
  },
  noAddressHint: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.brownSoft,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  changeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: "center",
  },
  changeButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.gold,
  },

  // No address CTA
  noAddressCta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  noAddressCtaText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    flex: 1,
    marginRight: spacing.sm,
  },
  addAddressButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  addAddressButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.gold,
  },

  // Primary button
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
  errorText: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.gold,
    textAlign: "center",
  },

  // Address selector modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
    alignSelf: "center",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
    marginBottom: spacing.md,
  },
  modalList: {
    flexGrow: 0,
  },
  modalFooter: {
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  modalCloseButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  modalCloseText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.brownSoft,
  },

  // Selector rows
  selectorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  selectorRowSelected: {
    borderColor: colors.gold,
    backgroundColor: "rgba(184, 149, 108, 0.14)",
  },
  selectorRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  selectorRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  selectorContent: {
    flex: 1,
  },
  selectorBadgeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: 3,
  },
  selectorLabel: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.gold,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  selectorDefault: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.gold,
    backgroundColor: "rgba(184, 149, 108, 0.14)",
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  selectorLine: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    marginTop: 1,
    lineHeight: 17,
  },

  // Order summary (GST breakdown)
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  summaryLabel: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.brownSoft,
  },
  summaryValue: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.charcoal,
  },

  // Coupon styles
  couponAppliedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.md,
  },
  couponAppliedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  couponCheckmark: {
    fontSize: 14,
    color: colors.gold,
    fontFamily: typography.sansMedium,
  },
  couponAppliedCode: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  couponAppliedDesc: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.goldMuted,
    marginTop: 1,
  },
  couponRemoveText: {
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.brownSoft,
  },
  couponInputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  couponInput: {
    flex: 1,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 0,
  },
  couponApplyButton: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  couponApplyText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.gold,
  },
  couponErrorText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.gold,
    marginTop: spacing.xs,
  },
});
