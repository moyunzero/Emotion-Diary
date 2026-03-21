/**
 * 闭区间时间范围内的情绪回顾统计（与 `components/Insights/index.tsx` 全量治愈进度不同）。
 */

import { MoodEntry, Status } from '../types';
import { getCalendarMonthRange } from './reviewStatsTimeRange';

export interface ResolutionPeriodStats {
  total: number;
  resolved: number;
  resolutionRate: number | null;
}

export interface ResolutionCompare {
  current: ResolutionPeriodStats;
  previous: ResolutionPeriodStats;
  deltaRate: number | null;
}

export const DEFAULT_MONTHLY_RESOLUTION_SERIES_MONTHS = 6;

export function filterEntriesInRange(
  entries: MoodEntry[],
  startMs: number,
  endMs: number,
): MoodEntry[] {
  return entries.filter(
    (e) => e.timestamp >= startMs && e.timestamp <= endMs,
  );
}

export function getResolutionPeriodStats(
  entries: MoodEntry[],
  startMs: number,
  endMs: number,
): ResolutionPeriodStats {
  const inRange = filterEntriesInRange(entries, startMs, endMs);
  const total = inRange.length;
  const resolved = inRange.filter((e) => e.status === Status.RESOLVED).length;
  return {
    total,
    resolved,
    resolutionRate: total === 0 ? null : resolved / total,
  };
}

export function compareResolutionToPreviousPeriod(
  entries: MoodEntry[],
  currentStart: number,
  currentEnd: number,
  previousStart: number,
  previousEnd: number,
): ResolutionCompare {
  const current = getResolutionPeriodStats(entries, currentStart, currentEnd);
  const previous = getResolutionPeriodStats(entries, previousStart, previousEnd);
  const deltaRate =
    current.resolutionRate !== null && previous.resolutionRate !== null
      ? current.resolutionRate - previous.resolutionRate
      : null;
  return { current, previous, deltaRate };
}

export interface MonthlyResolutionPoint {
  year: number;
  monthIndex0: number;
  rate: number | null;
  total: number;
  resolved: number;
}

/**
 * 从 anchorDate 所在月向前共 monthsBack 个自然月（含当月），最旧 → 最新。
 */
export function getMonthlyResolutionRateSeries(
  entries: MoodEntry[],
  monthsBack: number,
  anchorDate: Date,
): MonthlyResolutionPoint[] {
  const out: MonthlyResolutionPoint[] = [];
  const y = anchorDate.getFullYear();
  const m = anchorDate.getMonth();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(y, m - i, 1);
    const yr = d.getFullYear();
    const mo = d.getMonth();
    const { startMs, endMs } = getCalendarMonthRange(yr, mo);
    const stats = getResolutionPeriodStats(entries, startMs, endMs);
    out.push({
      year: yr,
      monthIndex0: mo,
      rate: stats.resolutionRate,
      total: stats.total,
      resolved: stats.resolved,
    });
  }

  return out;
}
