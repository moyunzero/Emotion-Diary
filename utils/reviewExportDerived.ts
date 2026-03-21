/**
 * 回顾导出单一派生状态：统计只算一次，供画布与 AI 摘要共用。
 */

import { calculateDaysAsOf } from '../services/companionDaysService';
import type { MoodEntry } from '../types';
import {
  compareResolutionToPreviousPeriod,
  getMonthlyResolutionRateSeries,
  type MonthlyResolutionPoint,
  type ResolutionCompare,
} from './reviewStats';
import { getTopThreeWeatherBucketsByDays } from './reviewStatsWeather';
import { getTopTriggersWithAdvice } from './reviewStatsTriggers';
import {
  getReviewExportPeriods,
  REVIEW_PRESET_LABEL,
  type ReviewExportPreset,
} from '../shared/time-range';

/** 与 AI 服务、画布数字同源的结构化摘要（无日记正文） */
export interface ReviewExportClosingSummary {
  presetLabel: string;
  periodStartMs: number;
  periodEndMs: number;
  companionDays: number;
  /** 与画布「—」同源：null 表示本期无解决率统计 */
  resolutionRatePct: number | null;
  deltaPct: number | null;
  totalEntries: number;
  resolvedEntries: number;
  topWeatherLines: string[];
  topTriggerLines: string[];
}

export interface ReviewExportDerivedState {
  current: { startMs: number; endMs: number };
  previous: { startMs: number; endMs: number };
  compare: ResolutionCompare;
  companionDays: number;
  monthlySeries: MonthlyResolutionPoint[];
  topWeather: ReturnType<typeof getTopThreeWeatherBucketsByDays>;
  topTriggers: ReturnType<typeof getTopTriggersWithAdvice>;
  closingSummary: ReviewExportClosingSummary;
}

function buildClosingSummary(
  preset: ReviewExportPreset,
  current: { startMs: number; endMs: number },
  compare: ResolutionCompare,
  companionDays: number,
  topWeather: ReturnType<typeof getTopThreeWeatherBucketsByDays>,
  topTriggers: ReturnType<typeof getTopTriggersWithAdvice>,
): ReviewExportClosingSummary {
  const resolutionRatePct =
    compare.current.resolutionRate === null
      ? null
      : Math.round(compare.current.resolutionRate * 100);

  const deltaPct =
    compare.deltaRate === null ? null : Math.round(compare.deltaRate * 100);

  return {
    presetLabel: REVIEW_PRESET_LABEL[preset],
    periodStartMs: current.startMs,
    periodEndMs: current.endMs,
    companionDays,
    resolutionRatePct,
    deltaPct,
    totalEntries: compare.current.total,
    resolvedEntries: compare.current.resolved,
    topWeatherLines: topWeather.map((w) => `${w.labelZh} ${w.days} 天`),
    topTriggerLines: topTriggers.map((t) => `${t.name} · ${t.count} 次`),
  };
}

export function computeReviewExportDerivedState(
  entries: MoodEntry[],
  firstEntryDate: number | null,
  preset: ReviewExportPreset,
  now: Date,
): ReviewExportDerivedState {
  const { current, previous } = getReviewExportPeriods(now, preset);
  const compare = compareResolutionToPreviousPeriod(
    entries,
    current.startMs,
    current.endMs,
    previous.startMs,
    previous.endMs,
  );
  const companionDays = calculateDaysAsOf(firstEntryDate, current.endMs);
  const monthlySeries = getMonthlyResolutionRateSeries(entries, 6, now);
  const topWeather = getTopThreeWeatherBucketsByDays(
    entries,
    current.startMs,
    current.endMs,
  );
  const topTriggers = getTopTriggersWithAdvice(
    entries,
    current.startMs,
    current.endMs,
  );
  const closingSummary = buildClosingSummary(
    preset,
    current,
    compare,
    companionDays,
    topWeather,
    topTriggers,
  );

  return {
    current,
    previous,
    compare,
    companionDays,
    monthlySeries,
    topWeather,
    topTriggers,
    closingSummary,
  };
}
