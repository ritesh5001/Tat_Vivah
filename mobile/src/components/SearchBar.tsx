import * as React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "../theme/tokens";

export function SearchBar() {
  return (
    <View style={styles.searchBlock}>
      <Text style={styles.sectionTitle}>Find your look</Text>
      <TextInput
        placeholder="Search sherwani, kurta, accessories"
        placeholderTextColor={colors.brownSoft}
        style={styles.searchInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBlock: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.charcoal,
  },
  searchInput: {
    marginTop: spacing.sm,
    backgroundColor: colors.warmWhite,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: typography.sans,
    color: colors.charcoal,
  },
});
