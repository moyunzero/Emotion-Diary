/**
 * Revisit banner subtitle — garden growth stage only (RET-01, D-03).
 */

import { excludeSoftDeletedEntries } from "@/shared/entries/visibility";
import {
  growthStageFromRate,
  type GrowthStageId,
} from "@/shared/garden/growthStage";
import { MoodEntry, Status } from "@/types";

/** Alias of shared GrowthStageId for retention subtitle mapping. */
export type RevisitSubtitleStageId = GrowthStageId;

/** Mirrors `computeResolveRate` in `services/gardenMilestone.ts`. */
function computeResolveRate(entries: readonly MoodEntry[]): number {
  const visible = excludeSoftDeletedEntries([...entries]);
  if (visible.length === 0) {
    return 0;
  }
  const resolved = visible.filter((e) => e.status === Status.RESOLVED).length;
  return resolved / visible.length;
}

export function resolveRevisitSubtitleKey(
  entries: readonly MoodEntry[],
): RevisitSubtitleStageId {
  return growthStageFromRate(computeResolveRate(entries));
}
