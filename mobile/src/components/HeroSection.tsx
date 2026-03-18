import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, radius, spacing, typography, shadow } from "../theme/tokens";

export function HeroSection() {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroEyebrow}>Curated men&apos;s fashion</Text>
      <Text style={styles.heroTitle}>The art of timeless elegance</Text>
      <Text style={styles.heroSubtitle}>
        Discover India&apos;s finest ethnic wear, handcrafted by artisans.
      </Text>
      <View style={styles.heroActions}>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Explore collection</Text>
        </Pressable>
        <Pressable style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Partner with us</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: "#F8F2EA",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  heroEyebrow: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  heroTitle: {
    marginTop: spacing.sm,
    fontFamily: typography.serif,
    fontSize: 30,
    color: colors.charcoal,
    lineHeight: 36,
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.brownSoft,
  },
  heroActions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.charcoal,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.background,
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  ghostButtonText: {
    color: colors.charcoal,
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
