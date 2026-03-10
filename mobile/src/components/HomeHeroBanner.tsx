import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CachedImage } from "./CachedImage";
import { images } from "../data/images";
import { colors, spacing, typography } from "../theme/tokens";
import { AppText as Text } from "./AppText";

interface HomeHeroBannerProps {
  onPress?: () => void;
}

export function HomeHeroBanner({ onPress }: HomeHeroBannerProps) {
  return (
    <Pressable style={styles.heroCard} onPress={onPress}>
      <CachedImage source={images.categories.kurta} style={styles.heroImage} contentFit="cover" />
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <Text style={styles.eyebrow}>TatVivah Welcomes You</Text>
        <Text style={styles.title}>Begin Your Royal Wedding Wardrobe Journey</Text>
        <Text style={styles.subtitle}>Handpicked sherwanis, tailored styles, and luxury edits crafted for your moments.</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    height: 368,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: "#1E1A17",
    justifyContent: "flex-end",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 26, 23, 0.36)",
  },
  heroContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  eyebrow: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#F2E7D4",
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 30,
    lineHeight: 34,
    color: "#FFFBF2",
  },
  subtitle: {
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: "#F2E7D4",
  },
});
