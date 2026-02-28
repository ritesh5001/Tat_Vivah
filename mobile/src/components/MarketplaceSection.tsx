import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, radius, spacing, typography, shadow } from "../theme/tokens";

interface MarketplaceSectionProps {
  onMarketplacePress?: () => void;
  onNewArrivalsPress?: () => void;
}

const featureCards = [
  {
    title: "Verified Artisans",
    copy: "Every atelier is vetted for craftsmanship and ethical production.",
  },
  {
    title: "Secure Checkout",
    copy: "Trusted payments with transparent pricing and GST invoices.",
  },
  {
    title: "Free Alterations",
    copy: "Tailoring support on key pieces for the perfect fit.",
  },
];

export function MarketplaceSection({
  onMarketplacePress,
  onNewArrivalsPress,
}: MarketplaceSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.marketplaceCard}>
        <Text style={styles.eyebrow}>Visit our marketplace</Text>
        <Text style={styles.title}>A curated destination for modern heritage</Text>
        <Text style={styles.copy}>
          Explore designer sherwanis, couture kurtas, and handcrafted accessories
          from across India. Every listing is curated for quality, fit, and
          authenticity.
        </Text>
        <Pressable style={styles.primaryButton} onPress={onMarketplacePress}>
          <Text style={styles.primaryButtonText}>Browse marketplace</Text>
        </Pressable>
      </View>

      <View style={styles.featureGrid}>
        {featureCards.map((feature) => (
          <View key={feature.title} style={styles.featureCard}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureCopy}>{feature.copy}</Text>
          </View>
        ))}
      </View>

      <View style={styles.heritageCard}>
        <Text style={styles.eyebrow}>New arrivals</Text>
        <Text style={styles.title}>The Heritage Collection</Text>
        <Text style={styles.copy}>
          Limited edition pieces crafted by third-generation artisans from
          Varanasi and Lucknow. Each release celebrates India's textile legacy.
        </Text>
        <Pressable style={styles.ghostButton} onPress={onNewArrivalsPress}>
          <Text style={styles.ghostButtonText}>Discover new arrivals</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  marketplaceCard: {
    padding: spacing.lg,
    backgroundColor: "#F8F2E8",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  heritageCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
    ...shadow.card,
  },
  eyebrow: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  title: {
    marginTop: spacing.xs,
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.charcoal,
  },
  copy: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.brownSoft,
  },
  primaryButton: {
    marginTop: spacing.lg,
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
    marginTop: spacing.lg,
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
  featureGrid: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  featureCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
    ...shadow.card,
  },
  featureTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  featureCopy: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
});
