/**
 * 回顾导出：按「自然日 max mood」映射四类气象站档位，按出现天数统计 Top3。
 */

import { MoodEntry, MoodLevel } from '../types';
import { filterEntriesInRange } from './reviewStats';

export type ExportWeatherBucket = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

/** 并列时次序：cloudy < rainy < stormy < sunny（与 1-CONTEXT 一致） */
const BUCKET_TIE_ORDER: ExportWeatherBucket[] = [
  'cloudy',
  'rainy',
  'stormy',
  'sunny',
];

const LABEL_ZH: Record<ExportWeatherBucket, string> = {
  sunny: '晴朗',
  cloudy: '多云',
  rainy: '有雨',
  stormy: '暴风雨',
};

export function moodLevelToExportWeatherBucket(
  level: MoodLevel,
): ExportWeatherBucket {
  const n = level as number;
  if (n <= 1) return 'sunny';
  if (n === 2) return 'cloudy';
  if (n === 3) return 'rainy';
  return 'stormy';
}

export function countWeatherBucketDaysByMaxMood(
  entries: MoodEntry[],
  startMs: number,
  endMs: number,
): Record<ExportWeatherBucket, number> {
  const counts: Record<ExportWeatherBucket, number> = {
    sunny: 0,
    cloudy: 0,
    rainy: 0,
    stormy: 0,
  };

  const cursor = new Date(startMs);
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= endMs) {
    const dayStart = new Date(cursor);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(23, 59, 59, 999);

    const ds = Math.max(dayStart.getTime(), startMs);
    const de = Math.min(dayEnd.getTime(), endMs);

    if (ds <= de) {
      const dayEntries = entries.filter(
        (e) => e.timestamp >= ds && e.timestamp <= de,
      );
      if (dayEntries.length > 0) {
        const maxLevel = Math.max(
          ...dayEntries.map((e) => e.moodLevel as number),
        ) as MoodLevel;
        const bucket = moodLevelToExportWeatherBucket(maxLevel);
        counts[bucket] += 1;
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return counts;
}

export function getTopThreeWeatherBucketsByDays(
  entries: MoodEntry[],
  startMs: number,
  endMs: number,
): { bucket: ExportWeatherBucket; days: number; labelZh: string }[] {
  const inRange = filterEntriesInRange(entries, startMs, endMs);
  const counts = countWeatherBucketDaysByMaxMood(inRange, startMs, endMs);

  const items = (Object.keys(counts) as ExportWeatherBucket[])
    .map((bucket) => ({
      bucket,
      days: counts[bucket],
      labelZh: LABEL_ZH[bucket],
    }))
    .filter((x) => x.days > 0);

  items.sort((a, b) => {
    if (b.days !== a.days) return b.days - a.days;
    return (
      BUCKET_TIE_ORDER.indexOf(a.bucket) - BUCKET_TIE_ORDER.indexOf(b.bucket)
    );
  });

  return items.slice(0, 3);
}
