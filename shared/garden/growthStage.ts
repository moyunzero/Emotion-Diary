/**
 * Pure rate → garden growth stage id (SC-4 / Insights thresholds).
 * Labels and icons stay in UI wrappers (Plan 13-05).
 */

export type GrowthStageId = 'seed' | 'sprout' | 'seedling' | 'bud' | 'bloom';

export function growthStageFromRate(
  rate: number | null | undefined,
): GrowthStageId {
  const value = rate ?? 0;
  if (value >= 0.8) return 'bloom';
  if (value >= 0.6) return 'bud';
  if (value >= 0.4) return 'seedling';
  if (value >= 0.2) return 'sprout';
  return 'seed';
}
