/**
 * Pure whitelist builder for widget snapshot (QUAL-03).
 * Inputs: plain MoodEntry[] + now — no store / UI / services imports.
 */

import { excludeSoftDeletedEntries, isSoftDeleted } from '../entries/visibility';
import { growthStageFromRate } from '../garden/growthStage';
import type { WeatherCondition } from '../weather/weatherNarrative';
import { MoodEntry, Status } from '../../types';
import {
  WIDGET_SNAPSHOT_SCHEMA_VERSION,
  type WidgetSnapshot,
} from './types';

/** Mirror store/modules/weather.ts WEATHER_THRESHOLDS (shared ↛ store). */
const WEATHER_THRESHOLDS = {
  cloudy: 10,
  rainy: 20,
  stormy: 30,
} as const;

/**
 * ACTIVE + !softDeleted score = sum(moodLevel * 2); thresholds match weather module.
 */
function weatherBucketFromEntries(
  entries: readonly MoodEntry[],
): WeatherCondition {
  const activeEntries = entries.filter(
    (e) => e.status === Status.ACTIVE && !isSoftDeleted(e),
  );
  const score = activeEntries.reduce(
    (acc, curr) => acc + curr.moodLevel * 2,
    0,
  );

  if (score > WEATHER_THRESHOLDS.stormy) return 'stormy';
  if (score > WEATHER_THRESHOLDS.rainy) return 'rainy';
  if (score > WEATHER_THRESHOLDS.cloudy) return 'cloudy';
  return 'sunny';
}

/** Inline computeResolveRate from services/gardenMilestone (shared ↛ services). */
function resolveRate(entries: readonly MoodEntry[]): number {
  const visible = excludeSoftDeletedEntries(entries);
  if (visible.length === 0) return 0;
  const resolved = visible.filter((e) => e.status === Status.RESOLVED).length;
  return resolved / visible.length;
}

/**
 * Build a privacy-safe widget snapshot (D-01, D-02, D-06, D-09).
 * Empty / no eligible entries → sunny + seed + entryCountActive 0.
 */
export function buildWidgetSnapshot(
  entries: readonly MoodEntry[],
  now: number,
): WidgetSnapshot {
  const visible = excludeSoftDeletedEntries(entries);
  const entryCountActive = visible.filter(
    (e) => e.status === Status.ACTIVE,
  ).length;

  return {
    schemaVersion: WIDGET_SNAPSHOT_SCHEMA_VERSION,
    updatedAt: now,
    weatherBucket: weatherBucketFromEntries(entries),
    growthStage: growthStageFromRate(resolveRate(entries)),
    entryCountActive,
  };
}
