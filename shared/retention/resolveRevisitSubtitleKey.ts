/**
 * Revisit banner subtitle — garden growth stage only (RET-01, D-03).
 */

import { excludeSoftDeletedEntries } from "@/shared/entries/visibility";
import { MoodEntry, Status } from "@/types";

export type RevisitSubtitleStageId =
  | "seed"
  | "sprout"
  | "seedling"
  | "bud"
  | "bloom";

/** Mirrors `computeResolveRate` in `services/gardenMilestone.ts`. */
function computeResolveRate(entries: readonly MoodEntry[]): number {
  const visible = excludeSoftDeletedEntries([...entries]);
  if (visible.length === 0) {
    return 0;
  }
  const resolved = visible.filter((e) => e.status === Status.RESOLVED).length;
  return resolved / visible.length;
}

/** Mirrors `getGrowthStage` thresholds in `components/Insights/utils.tsx`. */
function growthStageFromRate(rate: number): RevisitSubtitleStageId {
  if (rate >= 0.8) return "bloom";
  if (rate >= 0.6) return "bud";
  if (rate >= 0.4) return "seedling";
  if (rate >= 0.2) return "sprout";
  return "seed";
}

export function resolveRevisitSubtitleKey(
  entries: readonly MoodEntry[],
): RevisitSubtitleStageId {
  return growthStageFromRate(computeResolveRate(entries));
}
