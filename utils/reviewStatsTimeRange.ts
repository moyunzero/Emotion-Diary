/**
 * 回顾统计用时间边界（设备本地时区自然月 / 周一至周日自然周）。
 * 与 `.planning/phases/01-stats-aggregation/1-CONTEXT.md` D-01、D-02 一致。
 */

const MS_PER_DAY = 86400000;

/** 自然月闭区间：monthIndex0 为 JS 惯例 0=一月 */
export function getCalendarMonthRange(
  year: number,
  monthIndex0: number,
): { startMs: number; endMs: number } {
  const start = new Date(year, monthIndex0, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex0 + 1, 0, 23, 59, 59, 999);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

/** 与 `getWeekDates` 一致：date 所在周的周一 00:00:00.000 ～ 周日 23:59:59.999（本地） */
export function getMondayWeekRangeContaining(date: Date): {
  startMs: number;
  endMs: number;
} {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { startMs: monday.getTime(), endMs: sunday.getTime() };
}

/**
 * 紧邻的上一自然月。startMs 应为某月 1 日 0 点（本地）或该月内任一点，以所在月份推算上一整月。
 */
export function getPreviousCalendarMonthRangeBefore(startMs: number): {
  startMs: number;
  endMs: number;
} {
  const d = new Date(startMs);
  const y = d.getFullYear();
  const m = d.getMonth();
  const prevStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const prevEnd = new Date(y, m, 0, 23, 59, 59, 999);
  return { startMs: prevStart.getTime(), endMs: prevEnd.getTime() };
}

/**
 * 紧邻的上一完整自然周（周一～周日）。假定 current 周为 [startMs, endMs]。
 * Phase 2 应传入由 `getMondayWeekRangeContaining` 得到的标准周。
 */
export function getPreviousWeekRange(
  startMs: number,
  endMs: number,
): { startMs: number; endMs: number } | null {
  const span = endMs - startMs;
  if (span < 5 * MS_PER_DAY || span > 8 * MS_PER_DAY) {
    return null;
  }
  const prevStart = startMs - 7 * MS_PER_DAY;
  const prevEnd = startMs - 1;
  return { startMs: prevStart, endMs: prevEnd };
}

/** 回顾导出时间预设：本周 / 上周 / 本月 / 上月（自然周、自然月，本地时区） */
export type ReviewExportPreset =
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month';

/**
 * 当前统计区间与「环比用」上一同期区间。
 * `getPreviousWeekRange` 若返回 null（异常跨度），则退回「整 7 天前的同日区间」式边界，保证有数可算。
 */
export function getReviewExportPeriods(
  now: Date,
  preset: ReviewExportPreset,
): {
  current: { startMs: number; endMs: number };
  previous: { startMs: number; endMs: number };
} {
  const y = now.getFullYear();
  const m = now.getMonth();
  const thisMonthStart = getCalendarMonthRange(y, m).startMs;

  switch (preset) {
    case 'this_month': {
      const current = getCalendarMonthRange(y, m);
      const previous = getPreviousCalendarMonthRangeBefore(current.startMs);
      return { current, previous };
    }
    case 'last_month': {
      const current = getPreviousCalendarMonthRangeBefore(thisMonthStart);
      const previous = getPreviousCalendarMonthRangeBefore(current.startMs);
      return { current, previous };
    }
    case 'this_week': {
      const current = getMondayWeekRangeContaining(now);
      let previous = getPreviousWeekRange(current.startMs, current.endMs);
      if (!previous) {
        previous = {
          startMs: current.startMs - 7 * MS_PER_DAY,
          endMs: current.startMs - 1,
        };
      }
      return { current, previous };
    }
    case 'last_week': {
      const thisWeek = getMondayWeekRangeContaining(now);
      const lastWeek = getPreviousWeekRange(thisWeek.startMs, thisWeek.endMs);
      if (!lastWeek) {
        throw new Error('getReviewExportPeriods(last_week): invalid this-week span');
      }
      let previous = getPreviousWeekRange(lastWeek.startMs, lastWeek.endMs);
      if (!previous) {
        previous = {
          startMs: lastWeek.startMs - 7 * MS_PER_DAY,
          endMs: lastWeek.startMs - 1,
        };
      }
      return { current: lastWeek, previous };
    }
  }
}
