/**
 * 回顾导出单一派生状态：统计只算一次，供画布与 AI 摘要共用。
 */

import { i18n } from '@/i18n';
import type { AppLocale } from '@/i18n/mapDeviceLocale';
import { resolveTriggerLabel } from '@/i18n/resolvePresetLabel';
import { excludeSoftDeletedEntries } from '@/shared/entries/visibility';
import { calculateDaysAsOf } from '../services/companionDaysService';
import type { MoodEntry } from '../types';
import {
  getReviewExportPeriods,
  type ReviewExportPreset,
} from '../shared/time-range';
import {
  compareResolutionToPreviousPeriod,
  getMonthlyResolutionRateSeries,
  type MonthlyResolutionPoint,
  type ResolutionCompare,
} from './reviewStats';
import { getTopThreeWeatherBucketsByDays } from './reviewStatsWeather';
import { getTopTriggersWithAdvice } from './reviewStatsTriggers';

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
  locale: AppLocale,
): ReviewExportClosingSummary {
  const t = i18n.getFixedT(locale, 'review');
  const tDash = i18n.getFixedT(locale, 'dashboard');

  const resolutionRatePct =
    compare.current.resolutionRate === null
      ? null
      : Math.round(compare.current.resolutionRate * 100);

  const deltaPct =
    compare.deltaRate === null ? null : Math.round(compare.deltaRate * 100);

  return {
    presetLabel: t(`presets.${preset}`),
    periodStartMs: current.startMs,
    periodEndMs: current.endMs,
    companionDays,
    resolutionRatePct,
    deltaPct,
    totalEntries: compare.current.total,
    resolvedEntries: compare.current.resolved,
    topWeatherLines: topWeather.map((w) =>
      t('canvas.weatherLine', {
        label: tDash(`weatherStation.conditions.${w.bucket}`),
        days: w.days,
      }),
    ),
    topTriggerLines: topTriggers.map((trow) =>
      t('canvas.triggerLine', {
        name: resolveTriggerLabel(trow.name),
        count: trow.count,
      }),
    ),
  };
}

export function computeReviewExportDerivedState(
  entries: MoodEntry[],
  firstEntryDate: number | null,
  preset: ReviewExportPreset,
  now: Date,
  locale: AppLocale = i18n.language as AppLocale,
): ReviewExportDerivedState {
  const visible = excludeSoftDeletedEntries(entries);
  const { current, previous } = getReviewExportPeriods(now, preset);
  const compare = compareResolutionToPreviousPeriod(
    visible,
    current.startMs,
    current.endMs,
    previous.startMs,
    previous.endMs,
  );
  const companionDays = calculateDaysAsOf(firstEntryDate, current.endMs);
  const monthlySeries = getMonthlyResolutionRateSeries(visible, 6, now);
  const topWeather = getTopThreeWeatherBucketsByDays(
    visible,
    current.startMs,
    current.endMs,
  );
  const topTriggers = getTopTriggersWithAdvice(
    visible,
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
    locale,
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
