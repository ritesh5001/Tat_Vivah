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
import { colors, radius, spacing, typography, shadow } from "../../src/theme/tokens";

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
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

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email or phone</Text>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor={colors.brownSoft}
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor={colors.brownSoft}
            secureTextEntry
            style={styles.input}
          />

          <Pressable style={styles.linkRow}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>

          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Continue with Google</Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to TatVivah?</Text>
          <Link href="/(auth)/register" style={styles.footerLink}>
            Create account
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
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
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
    color: colors.charcoal,
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
