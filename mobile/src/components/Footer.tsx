import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../theme/tokens";

export function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerTitle}>Crafted with care in India</Text>
      <Text style={styles.footerCopy}>
        Verified artisans, secure checkout, and heritage craftsmanship in every piece.
      </Text>
      <View style={styles.footerLinks}>
        <Text style={styles.footerLink}>Shipping</Text>
        <Text style={styles.footerLink}>Returns</Text>
        <Text style={styles.footerLink}>Support</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: spacing.xxl,
    marginHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  footerTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  footerCopy: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  footerLinks: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
  footerLink: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.gold,
  },
});
