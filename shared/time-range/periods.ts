const MS_PER_DAY = 86400000;

export type ReviewExportPreset =
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month';

export type TimeRange = {
  startMs: number;
  endMs: number;
};

export function getCalendarMonthRange(year: number, monthIndex0: number): TimeRange {
  const start = new Date(year, monthIndex0, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex0 + 1, 0, 23, 59, 59, 999);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

export function getMondayWeekRangeContaining(date: Date): TimeRange {
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

export function getPreviousCalendarMonthRangeBefore(startMs: number): TimeRange {
  const d = new Date(startMs);
  const y = d.getFullYear();
  const m = d.getMonth();
  const prevStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const prevEnd = new Date(y, m, 0, 23, 59, 59, 999);
  return { startMs: prevStart.getTime(), endMs: prevEnd.getTime() };
}

export function getPreviousWeekRange(startMs: number, endMs: number): TimeRange | null {
  const span = endMs - startMs;
  if (span < 5 * MS_PER_DAY || span > 8 * MS_PER_DAY) {
    return null;
  }
  return {
    startMs: startMs - 7 * MS_PER_DAY,
    endMs: startMs - 1,
  };
}

export function getReviewExportPeriods(
  now: Date,
  preset: ReviewExportPreset,
): { current: TimeRange; previous: TimeRange } {
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
      const previous = getPreviousWeekRange(current.startMs, current.endMs) ?? {
        startMs: current.startMs - 7 * MS_PER_DAY,
        endMs: current.startMs - 1,
      };
      return { current, previous };
    }
    case 'last_week': {
      const thisWeek = getMondayWeekRangeContaining(now);
      const lastWeek = getPreviousWeekRange(thisWeek.startMs, thisWeek.endMs);
      if (!lastWeek) {
        throw new Error('getReviewExportPeriods(last_week): invalid this-week span');
      }
      const previous = getPreviousWeekRange(lastWeek.startMs, lastWeek.endMs) ?? {
        startMs: lastWeek.startMs - 7 * MS_PER_DAY,
        endMs: lastWeek.startMs - 1,
      };
      return { current: lastWeek, previous };
    }
  }
}
