import * as React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../src/theme/tokens";
import { useAuth } from "../../src/hooks/useAuth";
import { useToast } from "../../src/providers/ToastProvider";
import { AppHeader } from "../../src/components/AppHeader";
import { ApiError } from "../../src/services/api";
import { TatvivahLoader } from "../../src/components/TatvivahLoader";

export default function LoginScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ returnTo?: string }>();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const safeReturnTo = React.useMemo(() => {
    const returnTo =
      typeof searchParams.returnTo === "string"
        ? searchParams.returnTo
        : undefined;
    if (!returnTo) return "/";
    if (!returnTo.startsWith("/")) return "/";
    if (returnTo.startsWith("//") || returnTo.includes("://")) return "/";
    if (returnTo.startsWith("/login") || returnTo.startsWith("/(auth)/login")) {
      return "/";
    }
    return returnTo;
  }, [searchParams.returnTo]);

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn({ identifier, password });
      showToast("Welcome back", "success");
      router.replace(safeReturnTo as any);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Login failed";
      const lowered = raw.toLowerCase();
      const message =
        err instanceof ApiError && err.statusCode === 401
          ? "Invalid email or password"
          : lowered.includes("not found")
            ? "User not found"
            : lowered.includes("invalid")
              ? "Invalid credentials"
              : raw;
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Sign in" subtitle="TatVivah" showMenu showBack />
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>T</Text>
          </View>
          <View>
            <Text style={styles.brand}>TatVivah</Text>
            <Text style={styles.brandTag}>Premium Indian Fashion</Text>
          </View>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email or phone</Text>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor={colors.brownSoft}
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor={colors.brownSoft}
              secureTextEntry={!showPassword}
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable style={styles.eyeButton} onPress={() => setShowPassword((prev) => !prev)}>
              <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.linkRow}
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <TatvivahLoader size="sm" color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push("/(auth)/request-otp")}
          >
            <Text style={styles.secondaryButtonText}>Sign in with OTP</Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to TatVivah?</Text>
          <Link href="/register" style={styles.footerLink}>
            Create account
          </Link>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardWrap: {
    flex: 1,
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
    borderRadius: 12,
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
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
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
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    fontFamily: typography.sans,
    color: colors.charcoal,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  inputRow: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 46,
  },
  eyeButton: {
    position: "absolute",
    right: spacing.sm,
    top: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeText: {
    fontSize: 16,
  },
  linkRow: {
    alignItems: "flex-end",
    marginBottom: spacing.md,
  },
  linkText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.gold,
  },
  primaryButton: {
    backgroundColor: colors.charcoal,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.background,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSoft,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  secondaryButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.foreground,
  },
  errorText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: "#A65D57",
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
