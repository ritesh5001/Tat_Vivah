import { luxuryTheme } from "./theme";

export const colors = {
  background: luxuryTheme.background,
  headerBrown: luxuryTheme.dark,
  primaryAccent: luxuryTheme.accent,
  textPrimary: luxuryTheme.textPrimary,
  textSecondary: luxuryTheme.textSecondary,
  border: luxuryTheme.border,
  navbarBackground: luxuryTheme.card,
  white: luxuryTheme.card,
  black: luxuryTheme.dark,
  muted: luxuryTheme.muted,
  divider: luxuryTheme.border,
  transparent: luxuryTheme.transparent,
} as const;

export type AppColors = typeof colors;
