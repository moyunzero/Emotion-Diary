import type { AppLocale } from "../../i18n/mapDeviceLocale";
import { formatLocaleDate } from "../formatting";
import type { WeatherCondition } from "../weather/weatherNarrative";
import type { MoodEntry } from "../../types";
import type { ReviewExportDerivedState } from "../../utils/reviewExportDerived";
import type { ExportWeatherBucket } from "../../utils/reviewStatsWeather";

export type GrowthStageId = "seed" | "sprout" | "seedling" | "bud" | "bloom";

export type ShareCardVariant = "week";

export type ShareCardModel = {
  variant: ShareCardVariant;
  weatherBucket: ExportWeatherBucket | WeatherCondition;
  growthStage: GrowthStageId;
  closingOrRitualLine: string;
  weatherNarrativeLine: string;
  gardenStageLabel: string;
  userSnippet?: string;
  footerDate: string;
};

export type BuildWeekShareCardModelInputs = {
  derived: ReviewExportDerivedState;
  closingLine: string;
  effectiveLocale: AppLocale;
  /** 当前 preset 时间窗内的条目，用于关系天气叙事（moodMix / deadlinePressure） */
  periodEntries: MoodEntry[];
  userSnippet?: string;
};

function normalizeUserSnippet(raw?: string): string | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, 80);
}

function insightsT(locale: AppLocale) {
  const { i18n } = require("../../i18n") as typeof import("../../i18n");
  return i18n.getFixedT(locale, "insights");
}

function dashboardT(locale: AppLocale) {
  const { i18n } = require("../../i18n") as typeof import("../../i18n");
  return i18n.getFixedT(locale, "dashboard");
}

function resolveGrowthStage(
  rate: number | null,
  locale: AppLocale,
): { stage: GrowthStageId; label: string } {
  const t = insightsT(locale);
  const stage: GrowthStageId =
    (rate ?? 0) >= 0.8
      ? "bloom"
      : (rate ?? 0) >= 0.6
        ? "bud"
        : (rate ?? 0) >= 0.4
          ? "seedling"
          : (rate ?? 0) >= 0.2
            ? "sprout"
            : "seed";
  return { stage, label: t(`utils.growthStage.${stage}`) };
}

function shareT(locale: AppLocale) {
  const { i18n } = require("../../i18n") as typeof import("../../i18n");
  return i18n.getFixedT(locale, "share");
}

function resolveWeatherNarrativeLine(
  bucket: ExportWeatherBucket,
  periodEntries: MoodEntry[],
  locale: AppLocale,
  hasWeatherStats: boolean,
): string {
  if (!hasWeatherStats) {
    return String(shareT(locale)("canvas.weatherEmptyPeriod"));
  }
  const { computeWeatherNarrative } =
    require("../weather/weatherNarrative") as typeof import("../weather/weatherNarrative");
  const narrative = computeWeatherNarrative(periodEntries, bucket);
  const t = dashboardT(locale);
  return String(t(narrative.narrativeKey as never));
}

export function buildWeekShareCardModel(
  inputs: BuildWeekShareCardModelInputs,
): ShareCardModel {
  const { derived, closingLine, effectiveLocale, periodEntries } = inputs;
  const topWeather = derived.topWeather;
  const hasWeatherStats = topWeather.length > 0;
  const dominantBucket =
    topWeather[0]?.bucket ?? ("sunny" as ExportWeatherBucket);
  const { stage, label } = resolveGrowthStage(
    derived.compare.current.resolutionRate,
    effectiveLocale,
  );
  const narrativeLine = resolveWeatherNarrativeLine(
    dominantBucket,
    periodEntries,
    effectiveLocale,
    hasWeatherStats,
  );

  return {
    variant: "week",
    weatherBucket: dominantBucket,
    growthStage: stage,
    closingOrRitualLine: closingLine,
    weatherNarrativeLine: narrativeLine,
    gardenStageLabel: label,
    footerDate: formatLocaleDate(derived.current.endMs, effectiveLocale),
    userSnippet: normalizeUserSnippet(inputs.userSnippet),
  };
}
