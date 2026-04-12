import { luxuryTheme } from "./theme";

export const colors = {
  background: luxuryTheme.background,
  surface: luxuryTheme.muted,
  surfaceElevated: luxuryTheme.card,
  cream: luxuryTheme.muted,
  warmWhite: luxuryTheme.card,
  foreground: luxuryTheme.textPrimary,
  gold: luxuryTheme.accent,
  goldMuted: luxuryTheme.accent,
  charcoal: luxuryTheme.textPrimary,
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 24,
  xl: 32,
  xxl: 32,
};

export const radius = {
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
};

export const shadow = {
  card: {
    shadowColor: luxuryTheme.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
};
