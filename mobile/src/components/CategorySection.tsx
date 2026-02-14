import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { categoryCards } from "../data/categories";
import { colors, radius, spacing, typography, shadow } from "../theme/tokens";

export function CategorySection() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionEyebrow}>Shop by category</Text>
      <Text style={styles.sectionTitle}>Curated collections</Text>
      <View style={styles.grid}>
        {categoryCards.map((category) => (
          <View key={category.key} style={styles.card}>
            <Image
              source={category.image}
              style={styles.image}
              contentFit="cover"
              contentPosition="center"
              transition={200}
              cachePolicy="memory-disk"
            />
            <Text style={styles.title}>{category.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionEyebrow: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  sectionTitle: {
    marginTop: spacing.xs,
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.charcoal,
  },
  grid: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    ...shadow.card,
  },
  image: {
    height: 240,
    width: "100%",
    backgroundColor: colors.cream,
  },
  title: {
    padding: spacing.md,
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
});
