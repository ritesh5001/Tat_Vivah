export const luxuryTheme = {
  background: "#FAF7F2",
  dark: "#3D3329",
  /** Decorative metallic detail. Do not use for small text or controls. */
  accent: "#B7956C",
  /** AA-safe bronze for text, focus rings, and interactive surfaces. */
  accentStrong: "#80603D",
  onAccent: "#FFFCF8",
  textPrimary: "#2C2825",
  textSecondary: "#5C524A",
  border: "#E8E2D9",
  /** 3:1 against the app background for identifiable form controls. */
  borderStrong: "#8A7D72",
  shadow: "#2C2825",
  card: "#FFFCF8",
  muted: "#F4EFE7",
  media: "#000000",
  success: "#2E6B4F",
  warning: "#805A18",
  error: "#9B3A2F",
  overlay: "rgba(20, 18, 16, 0.58)",
  transparent: "transparent",
} as const;

export type LuxuryTheme = typeof luxuryTheme;
