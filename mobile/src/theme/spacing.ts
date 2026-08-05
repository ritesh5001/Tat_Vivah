export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 32,

  pageHorizontal: 16,
  sectionGap: 24,
  cardGap: 12,
} as const;

/**
 * Kept in step with `theme/tokens.ts` — two modules export a `radius` and
 * components import from whichever is nearer, so they have to agree or the same
 * card gets a different corner depending on which import it happened to use.
 */
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;
