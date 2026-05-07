import { Platform, type TextStyle } from "react-native";

const webFontStacks = {
  heading: "'Cormorant Garamond', 'Times New Roman', serif",
  serif: "'Cormorant Garamond', 'Times New Roman', serif",
  serifLight: "'Cormorant Garamond', 'Times New Roman', serif",
  body: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  bodyMedium: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  sansMedium: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export const typography = {
  heading: Platform.OS === "web" ? webFontStacks.heading : "CormorantGaramond_400Regular",
  serif: Platform.OS === "web" ? webFontStacks.serif : "CormorantGaramond_400Regular",
  serifLight: Platform.OS === "web" ? webFontStacks.serifLight : "CormorantGaramond_300Light",
  body: Platform.OS === "web" ? webFontStacks.body : "Inter_400Regular",
  bodyMedium: Platform.OS === "web" ? webFontStacks.bodyMedium : "Inter_500Medium",
  sans: Platform.OS === "web" ? webFontStacks.sans : "Inter_400Regular",
  sansMedium: Platform.OS === "web" ? webFontStacks.sansMedium : "Inter_500Medium",
  sizes: {
    heroTitle: 40,
    sectionTitle: 32,
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
    lineHeight: 44,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontFamily: typography.heading,
    fontSize: typography.sizes.sectionTitle,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  productTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.productTitle,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.bodyText,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodyTextSecondary: {
    fontFamily: typography.body,
    fontSize: typography.sizes.bodyText,
    lineHeight: 20,
    letterSpacing: 0,
    opacity: 0.9,
  },
};
