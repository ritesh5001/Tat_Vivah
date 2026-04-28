export const luxuryTheme = {
  background: "#FAF7F2",
  dark: "#3D3329",
  accent: "#B7956C",
  textPrimary: "#2C2825",
  textSecondary: "#5C524A",
  border: "#E8E2D9",
  shadow: "#2C2825",
  card: "#FFFCF8",
  muted: "#F4EFE7",
  transparent: "transparent",
} as const;

export type LuxuryTheme = typeof luxuryTheme;
