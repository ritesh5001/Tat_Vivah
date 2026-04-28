import * as React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
  colors,
  radius,
  spacing,
  typography,
  shadow,
} from "../../src/theme/tokens";
import { requestOtp } from "../../src/services/auth";
import { AppHeader } from "../../src/components/AppHeader";
import { TatvivahLoader } from "../../src/components/TatvivahLoader";
import {
  AppInput as TextInput,
  AppText as Text,
  ScreenContainer as SafeAreaView,
} from "../../src/components";

export default function RequestOtpScreen() {
  const router = useRouter();
  const [method, setMethod] = React.useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRequestOtp = async () => {
    const trimmed = method === "phone" ? identifier.trim() : identifier.trim().toLowerCase();
    if (!trimmed) {
      setError(method === "phone" ? "Please enter your mobile number." : "Please enter your email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await requestOtp(method === "phone" ? { phone: trimmed } : { email: trimmed });
      router.push({ pathname: "/(auth)/verify-otp", params: method === "phone" ? { method: "phone", phone: trimmed } : { method: "email", email: trimmed } });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send OTP";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Request OTP" subtitle="TatVivah" showMenu showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo row — same as login */}
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>T</Text>
          </View>
          <View>
            <Text style={styles.brand}>TatVivah</Text>
            <Text style={styles.brandTag}>Premium Indian Fashion</Text>
          </View>
        </View>

        <Text style={styles.title}>Sign in with OTP</Text>
        <Text style={styles.subtitle}>
          {method === "phone"
            ? "We'll send a one-time code to your mobile number."
            : "We'll send a one-time code to your email address."}
        </Text>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Pressable onPress={() => setMethod("phone")} style={[styles.toggleButton, method === "phone" && styles.toggleButtonActive]}>
              <Text style={[styles.toggleButtonText, method === "phone" && styles.toggleButtonTextActive]}>Mobile OTP</Text>
            </Pressable>
            <Pressable onPress={() => setMethod("email")} style={[styles.toggleButton, method === "email" && styles.toggleButtonActive]}>
              <Text style={[styles.toggleButtonText, method === "email" && styles.toggleButtonTextActive]}>Email OTP</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>{method === "phone" ? "Mobile number" : "Email address"}</Text>
          <TextInput
            placeholder={method === "phone" ? "9876543210" : "you@example.com"}
            placeholderTextColor={colors.brownSoft}
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType={method === "phone" ? "phone-pad" : "email-address"}
            autoCapitalize="none"
            autoComplete={method === "phone" ? "tel" : "email"}
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={handleRequestOtp}
            editable={!loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleRequestOtp}
            disabled={loading}
          >
            {loading ? (
              <TatvivahLoader size="sm" color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>Send OTP</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Prefer password?</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign in with password</Text>
          </Pressable>
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
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoBadge: {
    height: 44,
    width: 44,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  logoLetter: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
  },
  brand: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  brandTag: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.goldMuted,
    textTransform: "uppercase",
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
    borderRadius: 0,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  toggleRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing.md,
  },
  toggleButton: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  toggleButtonActive: {
    backgroundColor: colors.charcoal,
  },
  toggleButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.brown,
    textTransform: "uppercase",
  },
  toggleButtonTextActive: {
    color: colors.background,
  },
  label: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.brown,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    fontFamily: typography.sans,
    color: colors.charcoal,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 0,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.background,
  },
  errorText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.gold,
    marginBottom: spacing.sm,
  },
  footerRow: {
    marginTop: spacing.xl,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  footerLink: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.gold,
  },
});
