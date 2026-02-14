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

export default function CheckoutScreen() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const token = session?.accessToken ?? null;

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [shipping, setShipping] = React.useState({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    notes: "",
  });

  const handleCheckout = async () => {
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
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

      // 4. Verify payment on backend
      await verifyPayment(
        {
          razorpayOrderId: razorpayResult.razorpay_order_id,
          razorpayPaymentId: razorpayResult.razorpay_payment_id,
          razorpaySignature: razorpayResult.razorpay_signature,
        },
        token
      );

      // 5. Only navigate after successful verification
      router.replace("/orders");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Payment failed. Please try again.";
      setError(message);
      Alert.alert("Payment failed", message);
    } finally {
      setLoading(false);
    }
  };

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
          />

          <Pressable
            style={[styles.primaryButton, loading && { opacity: 0.5 }]}
            onPress={handleCheckout}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Processing…" : "Complete order"}
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
