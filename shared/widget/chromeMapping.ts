/**
 * Soft Stack chrome view-model from WidgetSnapshot (PLT-01).
 * Pure mapping for native WidgetKit / AppWidget parity — no store/RN deps.
 */

import type { GrowthStageId } from '../garden/growthStage';
import type { WeatherCondition } from '../weather/weatherNarrative';
import {
  WIDGET_SNAPSHOT_SCHEMA_VERSION,
  type WidgetSnapshot,
} from './types';

/** SF Symbol + Material icon keys per UI-SPEC weather table. */
export const WIDGET_WEATHER_ICON_KEYS = {
  sunny: { sf: 'sun.max.fill', material: 'wb_sunny' },
  cloudy: { sf: 'cloud.fill', material: 'cloud' },
  rainy: { sf: 'cloud.rain.fill', material: 'umbrella' },
  stormy: { sf: 'cloud.bolt.fill', material: 'thunderstorm' },
} as const satisfies Record<
  WeatherCondition,
  { readonly sf: string; readonly material: string }
>;

/** Bilingual growth stage titles (mirrors Insights utils.growthStage). */
export const WIDGET_GROWTH_STAGE_TITLES = {
  seed: { zh: '种子', en: 'Seed' },
  sprout: { zh: '发芽', en: 'Sprout' },
  seedling: { zh: '幼苗', en: 'Seedling' },
  bud: { zh: '花苞', en: 'Bud' },
  bloom: { zh: '开花', en: 'Bloom' },
} as const satisfies Record<
  GrowthStageId,
  { readonly zh: string; readonly en: string }
>;

export type WidgetChromeCleared = {
  mode: 'cleared';
  ctaZh: '打开心晴';
  ctaEn: 'Open Xinqing';
};

export type WidgetChromeStatus = {
  mode: 'status';
  weatherIconKey: string;
  weatherMaterialKey: string;
  growthStageTitleZh: string;
  growthStageTitleEn: string;
  brand: '心晴';
  isEmptyGarden: boolean;
};

export type WidgetChrome = WidgetChromeCleared | WidgetChromeStatus;

const WEATHER_BUCKETS = new Set<string>(
  Object.keys(WIDGET_WEATHER_ICON_KEYS),
);
const GROWTH_STAGES = new Set<string>(
  Object.keys(WIDGET_GROWTH_STAGE_TITLES),
);

function clearedChrome(): WidgetChromeCleared {
  return {
    mode: 'cleared',
    ctaZh: '打开心晴',
    ctaEn: 'Open Xinqing',
  };
}

function isValidSnapshot(input: unknown): input is WidgetSnapshot {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }
  const candidate = input as Record<string, unknown>;
  if (candidate.schemaVersion !== WIDGET_SNAPSHOT_SCHEMA_VERSION) {
    return false;
  }
  if (typeof candidate.updatedAt !== 'number') {
    return false;
  }
  if (!Number.isFinite(candidate.updatedAt) || candidate.updatedAt < 0) {
    return false;
  }
  if (typeof candidate.entryCountActive !== 'number') {
    return false;
  }
  if (
    !Number.isFinite(candidate.entryCountActive) ||
    candidate.entryCountActive < 0 ||
    !Number.isInteger(candidate.entryCountActive)
  ) {
    return false;
  }
  if (
    typeof candidate.weatherBucket !== 'string' ||
    !WEATHER_BUCKETS.has(candidate.weatherBucket)
  ) {
    return false;
  }
  if (
    typeof candidate.growthStage !== 'string' ||
    !GROWTH_STAGES.has(candidate.growthStage)
  ) {
    return false;
  }
  return true;
}

/**
 * Map raw sink payload → Soft Stack chrome.
 * Invalid / missing → cleared (D-10); valid including empty garden → status (D-09).
 * Never copies diary/PII or entryCountActive onto the view-model (D-04/D-05).
 */
export function mapSnapshotToChrome(input: unknown): WidgetChrome {
  if (!isValidSnapshot(input)) {
    return clearedChrome();
  }

  const weather = WIDGET_WEATHER_ICON_KEYS[input.weatherBucket];
  const growth = WIDGET_GROWTH_STAGE_TITLES[input.growthStage];

  return {
    mode: 'status',
    weatherIconKey: weather.sf,
    weatherMaterialKey: weather.material,
    growthStageTitleZh: growth.zh,
    growthStageTitleEn: growth.en,
    brand: '心晴',
    isEmptyGarden: input.entryCountActive === 0,
  };
}
