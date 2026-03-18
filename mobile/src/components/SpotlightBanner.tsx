import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, textStyles, typography } from "../theme";

export function SpotlightBanner() {
  return (
    <View style={styles.banner}>
      <Text style={[textStyles.bodyText, styles.label]}>Spotlight Banner</Text>
      <Text style={styles.subtitle}>Component scaffold ready for UI implementation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.navbarBackground,
    padding: spacing.lg,
    minHeight: 180,
    justifyContent: "center",
  },
  label: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: typography.sizes.bodyText,
    color: colors.textSecondary,
  },
});
