/**
 * 周期内 Top 触发器 + 园艺建议（与 `TriggerInsight` 计数一致）。
 */

import type { AppLocale } from '@/i18n/mapDeviceLocale';
import { resolveTriggerAdvice } from '@/i18n/resolvePresetLabel';
import { MoodEntry } from '../types';
import { filterEntriesInRange } from './reviewStats';

export function aggregateTriggerCounts(
  entries: MoodEntry[],
  startMs: number,
  endMs: number,
): { name: string; count: number }[] {
  const inRange = filterEntriesInRange(entries, startMs, endMs);
  const counts: Record<string, number> = {};
  inRange.forEach((e) => {
    e.triggers.forEach((t) => {
      counts[t] = (counts[t] ?? 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getTopTriggersWithAdvice(
  entries: MoodEntry[],
  startMs: number,
  endMs: number,
  limit = 3,
  locale?: AppLocale,
): { name: string; count: number; advice: string }[] {
  const ranked = aggregateTriggerCounts(entries, startMs, endMs);
  return ranked.slice(0, limit).map(({ name, count }) => ({
    name,
    count,
    advice: resolveTriggerAdvice(name, locale),
  }));
}
