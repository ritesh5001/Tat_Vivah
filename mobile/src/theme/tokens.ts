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

/**
 * Corner radii.
 *
 * The app was built on a hard 90° corner everywhere, which reads as unfinished
 * rather than severe. These are the softened replacements — restrained on
 * purpose: a luxury edit wants a corner you notice only if you look for it, not
 * the pill-shaped bubbles of a consumer app. The one exception is `pill`, for
 * things that genuinely are capsules (chips, badges, swipe tracks).
 *
 * Editorial surfaces on the home screen — the occasion grid, the hero banner and
 * shop-by-category — deliberately keep their square edge. Full-bleed imagery is
 * the one place the hard corner earns its keep.
 */
export const radius = {
  /** Chips, dots, small inline markers. */
  xs: 6,
  /** Inputs, small buttons, thumbnails. */
  sm: 10,
  /** Primary buttons, list rows, media. */
  md: 14,
  /** Cards, sheets, elevated surfaces. */
  lg: 18,
  /** Modals and full-width feature panels. */
  xl: 24,
  /** True capsules. */
  pill: 999,
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
