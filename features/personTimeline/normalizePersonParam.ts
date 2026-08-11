/**
 * Coerce Expo Router `person` search param for Person Timeline (REL-01).
 * Exact string passthrough — no trim / case-fold (Phase 13 D-03).
 */
export function normalizePersonParam(
  raw: string | string[] | undefined,
): string | undefined {
  if (raw === undefined) return undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || value === '') return undefined;
  return value;
}
