import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "./CompatImage";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme/tokens";

interface HeaderProps {
  onMenuPress: () => void;
  logoSource: number;
}

export function Header({ onMenuPress, logoSource }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logoBadge}>
        <Image source={logoSource} style={styles.logoImage} contentFit="contain" />
      </View>
      <View style={styles.brandStack}>
        <Text style={styles.brand}>TatVivah</Text>
        <Text style={styles.brandTag}>Premium Indian Fashion</Text>
      </View>
      <Pressable style={styles.menuButton} onPress={onMenuPress}>
        <Ionicons name="menu" size={20} color={colors.charcoal} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  logoBadge: {
    height: 44,
    width: 44,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    height: 30,
    width: 30,
  },
  brandStack: {
    marginLeft: spacing.sm,
    flex: 1,
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
  menuButton: {
    height: 40,
    width: 40,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warmWhite,
  },
});
