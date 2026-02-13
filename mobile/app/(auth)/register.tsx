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

export default function RegisterScreen() {
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

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join curated fashion for every occasion.</Text>

        <View style={styles.segmented}>
          <View style={[styles.segment, styles.segmentActive]}>
            <Text style={[styles.segmentText, styles.segmentTextActive]}>Buyer</Text>
          </View>
          <View style={styles.segment}>
            <Text style={styles.segmentText}>Seller</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            placeholder="Enter your name"
            placeholderTextColor={colors.brownSoft}
            style={styles.input}
          />

          <Text style={styles.label}>Email or phone</Text>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor={colors.brownSoft}
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Create a password"
            placeholderTextColor={colors.brownSoft}
            secureTextEntry
            style={styles.input}
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            placeholder="Re-enter password"
            placeholderTextColor={colors.brownSoft}
            secureTextEntry
            style={styles.input}
          />

          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Create account</Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/login" style={styles.footerLink}>
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
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.warmWhite,
    ...shadow.card,
  },
  segmentText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  segmentTextActive: {
    color: colors.charcoal,
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
