import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../src/theme/tokens";
import { checkout } from "../../src/services/cart";
import { initiatePayment, verifyPayment } from "../../src/services/payments";
import { openRazorpayCheckout } from "../../src/services/razorpay";
import { ApiError } from "../../src/services/api";
import { useAuth } from "../../src/hooks/useAuth";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";
import { useCart } from "../../src/providers/CartProvider";
import { useToast } from "../../src/providers/ToastProvider";

export default function CheckoutScreen() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const token = session?.accessToken ?? null;
  const { isConnected } = useNetworkStatus();
  const { clearCart, refreshCart, cartItems } = useCart();
  const { showToast } = useToast();

  // ---------- Payment guard — prevents double-submit ----------
  const [isPaying, setIsPaying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [shipping, setShipping] = React.useState({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    notes: "",
  });

  // Redirect if cart is empty (navigated directly, or cart cleared)
  React.useEffect(() => {
    if (!authLoading && cartItems.length === 0 && !isPaying) {
      // Don't redirect while a payment is in-flight
      // Cart will be empty after successful checkout → we navigate from handleCheckout
    }
  }, [authLoading, cartItems.length, isPaying]);

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

    setIsPaying(true);
    setError(null);

    try {
      // 1. Create order via checkout
      const orderResult = await checkout(
        {
          shippingName: shipping.name || undefined,
          shippingPhone: shipping.phone || undefined,
          shippingEmail: shipping.email || undefined,
          shippingAddressLine1: shipping.addressLine1 || undefined,
          shippingAddressLine2: shipping.addressLine2 || undefined,
          shippingCity: shipping.city || undefined,
          shippingNotes: shipping.notes || undefined,
        },
        token
      );

      const orderId = orderResult.order?.id;
      if (!orderId) {
        throw new Error("Order ID missing. Please try again.");
      }

      // 2. Initiate Razorpay payment
      const payment = await initiatePayment(orderId, token);
      const { key, orderId: razorpayOrderId, amount, currency } = payment.data;

      // 3. Open Razorpay native checkout
      const razorpayResult = await openRazorpayCheckout({
        key,
        amount,
        currency,
        name: "TatVivah",
        description: "Order Payment",
        order_id: razorpayOrderId,
        theme: { color: "#B8956C" },
        prefill: {
          name: shipping.name || undefined,
          email: shipping.email || undefined,
          contact: shipping.phone || undefined,
        },
      });

      // 4. Verify payment on backend — CRITICAL: do NOT navigate before this
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
        clearCart();
        // Refresh to sync server state (cart should now be empty)
        refreshCart();
        router.replace("/orders");
      }
    } catch (err) {
      if (!mountedRef.current) return; // Component unmounted during payment

      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Payment failed. Please try again.";
      setError(message);
      showToast(message, "error");
    } finally {
      if (mountedRef.current) {
        setIsPaying(false);
      }
    }
  };

  const isButtonDisabled = isPaying || !isConnected || cartItems.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>
          Provide delivery details to complete your order.
        </Text>

        <View style={styles.card}>
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

          <Pressable
            style={[
              styles.primaryButton,
              isButtonDisabled && styles.buttonDisabled,
            ]}
            onPress={handleCheckout}
            disabled={isButtonDisabled}
          >
            <Text style={styles.primaryButtonText}>
              {isPaying
                ? "Processing\u2026"
                : !isConnected
                  ? "Offline"
                  : cartItems.length === 0
                    ? "Cart is empty"
                    : "Complete order"}
            </Text>
          </Pressable>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
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
    padding: spacing.lg,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: colors.charcoal,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.warmWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
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
    marginBottom: spacing.md,
  },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.charcoal,
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
    color: "#A65D57",
    textAlign: "center",
  },
});
