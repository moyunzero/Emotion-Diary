/**
 * Widget privacy snapshot contract (QUAL-03 / D-01).
 * Whitelist-only DTO for lock-screen-bound chrome — never diary PII.
 */

import type { GrowthStageId } from '../garden/growthStage';
import type { WeatherCondition } from '../weather/weatherNarrative';

/** Schema version for WidgetSnapshot (start at 1). */
export const WIDGET_SNAPSHOT_SCHEMA_VERSION = 1 as const;

/**
 * Conceptual forbid list (D-01) — must never appear as keys on the snapshot object.
 * Documented for tests/docs; builder emits whitelist fields only.
 */
export const WIDGET_SNAPSHOT_FORBIDDEN_KEYS = [
  'content',
  'people',
  'triggers',
  'audios',
  'remoteUrl',
  'id',
  'email',
  'name',
] as const;

export type WidgetSnapshot = {
  schemaVersion: typeof WIDGET_SNAPSHOT_SCHEMA_VERSION;
  /** Epoch ms (aligns with MoodEntry.timestamp). */
  updatedAt: number;
  weatherBucket: WeatherCondition;
  growthStage: GrowthStageId;
  /** Count of Status.ACTIVE && !softDeleted entries. */
  entryCountActive: number;
};
