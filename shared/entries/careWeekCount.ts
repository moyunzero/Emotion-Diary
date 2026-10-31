import { getMondayWeekRangeContaining } from '../time-range/periods';

/**
 * Count entries whose timestamp falls in the Monday–Sunday week containing `now` (D-19).
 * Callers should pass already-visible (non-soft-deleted) entries.
 */
export function careWeekCount(
  entries: readonly { timestamp: number }[],
  now: Date = new Date(),
): number {
  const { startMs, endMs } = getMondayWeekRangeContaining(now);
  return entries.filter(
    (e) => e.timestamp >= startMs && e.timestamp <= endMs,
  ).length;
}
