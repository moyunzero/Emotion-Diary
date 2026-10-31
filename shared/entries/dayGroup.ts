/**
 * Dashboard day grouping (ECHO-04 / D-37, D-43, D-44).
 * Pure helpers — localDayKey only; no i18n bootstrap / RN side effects.
 * Callers filter first (filterDashboardEntries), then group.
 */

import { localDayKey } from '../formatting/localCalendar';
import type { MoodEntry } from '../../types';

export type DayHeaderItem = {
  type: 'dayHeader';
  dayKey: string;
  label: string;
};

export type DayEntryItem = {
  type: 'entry';
  entry: MoodEntry;
};

export type DashboardDayItem = DayHeaderItem | DayEntryItem;

export type DashboardDayLocale = 'zh-Hans' | 'en-US';

const DAY_MS = 24 * 60 * 60 * 1000;

const TODAY_LABEL: Record<DashboardDayLocale, string> = {
  'zh-Hans': '今天',
  'en-US': 'Today',
};

const YESTERDAY_LABEL: Record<DashboardDayLocale, string> = {
  'zh-Hans': '昨天',
  'en-US': 'Yesterday',
};

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Parse YYYY-MM-DD as local calendar midnight (not UTC ISO slice). */
function dateFromDayKey(dayKey: string): Date {
  const [y, m, d] = dayKey.split('-').map((part) => Number(part));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Bucket already filter-ordered entries by local day.
 * Preserves first-seen dayKey order; never emits empty buckets (D-44).
 */
export function groupDashboardEntriesByDay(
  entries: MoodEntry[],
): { dayKey: string; entries: MoodEntry[] }[] {
  const map = new Map<string, MoodEntry[]>();
  for (const entry of entries) {
    const key = localDayKey(entry.timestamp);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      map.set(key, [entry]);
    }
  }
  return [...map.entries()].map(([dayKey, dayEntries]) => ({
    dayKey,
    entries: dayEntries,
  }));
}

/**
 * Day header: today / yesterday / weekday + month-day (D-37).
 * Includes year only on cross-year edges. Not N-days-ago (avoid formatRelativeDayLabel).
 */
export function formatDashboardDayHeader(
  dayKey: string,
  now: Date = new Date(),
  locale: DashboardDayLocale = 'zh-Hans',
): string {
  const target = dateFromDayKey(dayKey);
  const diffDays = Math.round(
    (startOfLocalDay(now) - startOfLocalDay(target)) / DAY_MS,
  );

  if (diffDays === 0) return TODAY_LABEL[locale];
  if (diffDays === 1) return YESTERDAY_LABEL[locale];

  const includeYear = target.getFullYear() !== now.getFullYear();

  if (locale === 'zh-Hans') {
    const weekday = new Intl.DateTimeFormat('zh-Hans', {
      weekday: 'short',
    }).format(target);
    const monthDay = `${target.getMonth() + 1}月${target.getDate()}日`;
    if (includeYear) {
      return `${weekday} ${target.getFullYear()}年${monthDay}`;
    }
    return `${weekday} ${monthDay}`;
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' as const } : {}),
  }).format(target);
}

/** Flatten groups into FlashList rows: dayHeader then entries (no empty headers). */
export function buildDashboardDaySections(
  entries: MoodEntry[],
  now: Date = new Date(),
  locale: DashboardDayLocale = 'zh-Hans',
): DashboardDayItem[] {
  const groups = groupDashboardEntriesByDay(entries);
  const items: DashboardDayItem[] = [];
  for (const group of groups) {
    items.push({
      type: 'dayHeader',
      dayKey: group.dayKey,
      label: formatDashboardDayHeader(group.dayKey, now, locale),
    });
    for (const entry of group.entries) {
      items.push({ type: 'entry', entry });
    }
  }
  return items;
}
