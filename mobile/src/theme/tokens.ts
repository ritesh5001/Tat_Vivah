import { luxuryTheme } from "./theme";

export const colors = {
  background: luxuryTheme.background,
  surface: luxuryTheme.background,
  surfaceElevated: luxuryTheme.background,
  cream: luxuryTheme.background,
  warmWhite: luxuryTheme.background,
  foreground: luxuryTheme.textPrimary,
  gold: luxuryTheme.accent,
  goldMuted: luxuryTheme.accent,
  charcoal: luxuryTheme.dark,
  brown: luxuryTheme.dark,
  brownSoft: luxuryTheme.textSecondary,
  borderSoft: luxuryTheme.border,
};

export const typography = {
  serif: "CormorantGaramond_400Regular",
  serifLight: "CormorantGaramond_300Light",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
};

export const shadow = {
  card: {
    shadowColor: luxuryTheme.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 3,
  },
};
