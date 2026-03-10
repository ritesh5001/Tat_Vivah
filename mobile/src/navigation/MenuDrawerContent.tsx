import React from "react";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";

const CATEGORY_ITEMS = [
  "Kurta & Jacket",
  "Sherwani & Indo Western",
  "Bestseller",
  "New Arrivals",
  "Kurta Pajama",
  "Kurta Jacket Set",
  "Only Kurta",
  "Short Kurta",
  "Nehru Jacket",
  "Jodhpuri Suit",
  "Indo Western",
] as const;

export function DrawerMenuContent({ navigation }: DrawerContentComponentProps) {
  const handleCategoryPress = (category: string) => {
    navigation.navigate("Home", { category });
    navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>MEN</Text>
      </View>

      <View style={styles.section}>
        {CATEGORY_ITEMS.map((item) => (
          <Pressable
            key={item}
            style={styles.row}
            onPress={() => handleCategoryPress(item)}
          >
            <Text style={styles.rowText}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: typography.sizes.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    paddingVertical: spacing.sm,
  },
  rowText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.bodyText,
    color: colors.textPrimary,
  },
});
