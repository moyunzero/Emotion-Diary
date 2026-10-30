/**
 * AppChip contract helpers — Jest-safe (no JSX / RN StyleSheet).
 * UI lives in AppChip.tsx; Wave 0 / Plan 04 tests load this under node env.
 */

/**
 * PRIM-02: selected chips must show Check, not color-only.
 */
export function appChipSelectedShowsCheck(selected: boolean): boolean {
  return selected;
}
