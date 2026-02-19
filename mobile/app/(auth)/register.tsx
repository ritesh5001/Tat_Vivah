import * as React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../src/theme/tokens";
import { registerUser } from "../../src/services/auth";
import { AppHeader } from "../../src/components/AppHeader";

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password) {
      setError("Please fill all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerUser({ fullName, email, phone, password });
      router.replace("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Create account" subtitle="TatVivah" showMenu showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>T</Text>
          </View>
          <View>
            <Text style={styles.brand}>TatVivah</Text>
            <Text style={styles.brandTag}>Premium Indian Fashion</Text>
          </View>
        </View>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join curated fashion for every occasion.</Text>

        <View style={styles.accountBadge}>
          <Text style={styles.accountBadgeText}>Buyer account</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            placeholder="Enter your name"
            placeholderTextColor={colors.brownSoft}
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor={colors.brownSoft}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.brownSoft}
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Create a password"
            placeholderTextColor={colors.brownSoft}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            placeholder="Re-enter password"
            placeholderTextColor={colors.brownSoft}
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={handleRegister}>
            <Text style={styles.primaryButtonText}>
              {loading ? "Creating..." : "Create account"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/login" style={styles.footerLink}>
            Sign in
          </Link>
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.cream,
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
    color: colors.brownSoft,
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
  accountBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  accountBadgeText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.brown,
    textTransform: "uppercase",
    letterSpacing: 1.4,
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
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    marginTop: spacing.sm,
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
