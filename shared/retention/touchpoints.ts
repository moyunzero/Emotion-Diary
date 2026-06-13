/**
 * 留存触达纯逻辑（A2/A3 · 009）
 */

import { excludeSoftDeletedEntries } from "@/shared/entries/visibility";
import type { MoodEntry } from "@/types";

/** 回访横幅：距上次可见记录至少 N 天 */
export const REVISIT_BANNER_MIN_DAYS = 2;

/** 周回顾横幅：周内至少有 1 条可见记录才展示 */
export const WEEKLY_REVIEW_MIN_ENTRIES = 1;

export function getLatestVisibleEntryTimestamp(
  entries: readonly MoodEntry[],
): number | null {
  const visible = excludeSoftDeletedEntries(entries);
  if (visible.length === 0) return null;
  return Math.max(...visible.map((e) => e.timestamp));
}

export function daysSinceTimestamp(
  timestampMs: number,
  nowMs: number = Date.now(),
): number {
  const diff = nowMs - timestampMs;
  if (diff <= 0) return 0;
  return Math.floor(diff / 86400000);
}

export function shouldShowRevisitBanner(
  entries: readonly MoodEntry[],
  dismissedUntilMs: number | null,
  nowMs: number = Date.now(),
): { show: boolean; daysSince: number } {
  if (dismissedUntilMs != null && nowMs < dismissedUntilMs) {
    return { show: false, daysSince: 0 };
  }

  const latest = getLatestVisibleEntryTimestamp(entries);
  if (latest == null) {
    return { show: false, daysSince: 0 };
  }

  const daysSince = daysSinceTimestamp(latest, nowMs);
  return {
    show: daysSince >= REVISIT_BANNER_MIN_DAYS,
    daysSince,
  };
}

/** ISO 周键：YYYY-Www（本地时区） */
export function getIsoWeekKey(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function countVisibleEntriesThisWeek(
  entries: readonly MoodEntry[],
  now: Date = new Date(),
): number {
  const visible = excludeSoftDeletedEntries(entries);
  const start = new Date(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  return visible.filter((e) => e.timestamp >= startMs).length;
}

export function shouldShowWeeklyReviewBanner(
  entries: readonly MoodEntry[],
  dismissedWeekKey: string | null,
  now: Date = new Date(),
): boolean {
  const weekKey = getIsoWeekKey(now);
  if (dismissedWeekKey === weekKey) return false;

  const day = now.getDay();
  const isWeekendTouch = day === 0 || day === 6 || day === 5;
  if (!isWeekendTouch) return false;

  return (
    countVisibleEntriesThisWeek(entries, now) >= WEEKLY_REVIEW_MIN_ENTRIES
  );
}
