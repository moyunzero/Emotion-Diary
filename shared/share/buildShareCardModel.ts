import type { TFunction } from "i18next";
import type { AppLocale } from "../../i18n/mapDeviceLocale";
import { i18n } from "../../i18n";
import { excludeSoftDeletedEntries } from "../entries/visibility";
import { formatLocaleDate } from "../formatting";
import type { WeatherCondition } from "../weather/weatherNarrative";
import { computeWeatherNarrative } from "../weather/weatherNarrative";
import type { ReviewExportDerivedState } from "../../utils/reviewExportDerived";
import type { ExportWeatherBucket } from "../../utils/reviewStatsWeather";
import { MoodEntry, Status } from "../../types";

export type GrowthStageId = "seed" | "sprout" | "seedling" | "bud" | "bloom";

export type ShareCardVariant = "week" | "resolve" | "burn";
export type RitualAccent = "resolve" | "burn";

export type ShareCardModel = {
  variant: ShareCardVariant;
  weatherBucket: ExportWeatherBucket | WeatherCondition;
  growthStage: GrowthStageId;
  closingOrRitualLine: string;
  weatherNarrativeLine: string;
  gardenStageLabel: string;
  userSnippet?: string;
  footerDate: string;
  ritualAccent?: RitualAccent;
};

export type BuildWeekShareCardModelInputs = {
  derived: ReviewExportDerivedState;
  closingLine: string;
  effectiveLocale: AppLocale;
  userSnippet?: string;
};

export type BuildResolveShareCardModelInputs = {
  entries: readonly MoodEntry[];
  weatherCondition: WeatherCondition;
  effectiveLocale: AppLocale;
  footerDateMs: number;
  userSnippet?: string;
};

export type BuildBurnShareCardModelInputs = {
  effectiveLocale: AppLocale;
  footerDateMs: number;
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

function insightsT(locale: AppLocale): TFunction<"insights"> {
  return i18n.getFixedT(locale, "insights");
}

function shareT(locale: AppLocale): TFunction<"share"> {
  return i18n.getFixedT(locale, "share");
}

function dashboardT(locale: AppLocale): TFunction<"dashboard"> {
  return i18n.getFixedT(locale, "dashboard");
}

function computeResolveRate(entries: readonly MoodEntry[]): number {
  const visible = excludeSoftDeletedEntries([...entries]);
  if (visible.length === 0) {
    return 0;
  }
  const resolved = visible.filter((e) => e.status === Status.RESOLVED).length;
  return resolved / visible.length;
}

function getGrowthStageId(rate: number): GrowthStageId {
  if (rate >= 0.8) return "bloom";
  if (rate >= 0.6) return "bud";
  if (rate >= 0.4) return "seedling";
  if (rate >= 0.2) return "sprout";
  return "seed";
}

function resolveGrowthStage(
  rate: number | null,
  locale: AppLocale,
): { stage: GrowthStageId; label: string } {
  const t = insightsT(locale);
  const stage = getGrowthStageId(rate ?? 0);
  return { stage, label: t(`utils.growthStage.${stage}`) };
}

function resolveWeatherNarrativeLine(
  entries: readonly MoodEntry[],
  condition: WeatherCondition,
  locale: AppLocale,
): string {
  const narrative = computeWeatherNarrative(entries, condition);
  const t = dashboardT(locale);
  return String(t(narrative.narrativeKey as never));
}

export function buildWeekShareCardModel(
  inputs: BuildWeekShareCardModelInputs,
): ShareCardModel {
  const { derived, closingLine, effectiveLocale } = inputs;
  const dominantBucket =
    derived.topWeather[0]?.bucket ?? ("sunny" as ExportWeatherBucket);
  const { stage, label } = resolveGrowthStage(
    derived.compare.current.resolutionRate,
    effectiveLocale,
  );
  const narrativeLine = resolveWeatherNarrativeLine(
    [],
    dominantBucket,
    effectiveLocale,
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

export function buildResolveShareCardModel(
  inputs: BuildResolveShareCardModelInputs,
): ShareCardModel {
  const { entries, weatherCondition, effectiveLocale, footerDateMs } = inputs;
  const rate = computeResolveRate(entries);
  const { stage, label } = resolveGrowthStage(rate, effectiveLocale);
  const tShare = shareT(effectiveLocale);

  return {
    variant: "resolve",
    weatherBucket: weatherCondition,
    growthStage: stage,
    closingOrRitualLine: tShare("canvas.resolve.moment"),
    weatherNarrativeLine: resolveWeatherNarrativeLine(
      entries,
      weatherCondition,
      effectiveLocale,
    ),
    gardenStageLabel: label,
    footerDate: formatLocaleDate(footerDateMs, effectiveLocale),
    ritualAccent: "resolve",
    userSnippet: normalizeUserSnippet(inputs.userSnippet),
  };
}

export function buildBurnShareCardModel(
  inputs: BuildBurnShareCardModelInputs,
): ShareCardModel {
  const tShare = shareT(inputs.effectiveLocale);
  const { stage, label } = resolveGrowthStage(0, inputs.effectiveLocale);

  return {
    variant: "burn",
    weatherBucket: "sunny",
    growthStage: stage,
    closingOrRitualLine: tShare("canvas.burn.moment"),
    weatherNarrativeLine: tShare("canvas.burn.moment"),
    gardenStageLabel: label,
    footerDate: formatLocaleDate(inputs.footerDateMs, inputs.effectiveLocale),
    ritualAccent: "burn",
    userSnippet: normalizeUserSnippet(inputs.userSnippet),
  };
}
