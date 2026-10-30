/**
 * AppChip contract helpers — Jest-safe (no JSX / RN StyleSheet).
 * UI lives in AppChip.tsx; Wave 0 / Plan 04 / 23-11 tests load this under node env.
 */

/**
 * G-23-2 / PRIM-02 reopen: selected chips do not show a checkmark glyph.
 * Export name kept for stable imports; always returns false.
 */
export function appChipSelectedShowsCheck(_selected: boolean): boolean {
  return false;
}

/**
 * PRIM-05 non-color-only: selected border weight (1.5–2) vs unselected hairline (1).
 */
export function appChipSelectedBorderWidth(selected: boolean): number {
  return selected ? 2 : 1;
}
