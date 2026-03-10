import type { TextStyle } from "react-native";

export const typography = {
  heading: "CormorantGaramond_400Regular",
  serif: "CormorantGaramond_400Regular",
  serifLight: "CormorantGaramond_300Light",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sizes: {
    heroTitle: 28,
    sectionTitle: 24,
    productTitle: 16,
    bodyText: 14,
  },
} as const;

export const textStyles: Record<
  "header" | "sectionTitle" | "productTitle" | "bodyText" | "bodyTextSecondary",
  TextStyle
> = {
  header: {
    fontFamily: typography.heading,
    fontSize: typography.sizes.heroTitle,
    lineHeight: 34,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontFamily: typography.heading,
    fontSize: typography.sizes.sectionTitle,
    lineHeight: 30,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  productTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.productTitle,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  bodyText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.bodyText,
    lineHeight: 20,
    letterSpacing: 0.08,
  },
  bodyTextSecondary: {
    fontFamily: typography.body,
    fontSize: typography.sizes.bodyText,
    lineHeight: 20,
    letterSpacing: 0.08,
    opacity: 0.9,
  },
};
