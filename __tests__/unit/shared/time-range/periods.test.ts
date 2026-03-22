import {
  REVIEW_PRESET_LABEL,
  getCalendarMonthRange,
  getMondayWeekRangeContaining,
  getPreviousCalendarMonthRangeBefore,
  getPreviousWeekRange,
  getReviewExportPeriods,
} from '../../../../shared/time-range';

describe('shared/time-range canonical', () => {
  it('maps preset labels from single source', () => {
    expect(REVIEW_PRESET_LABEL.this_week).toBe('本周');
    expect(REVIEW_PRESET_LABEL.last_week).toBe('上周');
    expect(REVIEW_PRESET_LABEL.this_month).toBe('本月');
    expect(REVIEW_PRESET_LABEL.last_month).toBe('上月');
  });

  it('returns monday-to-sunday closed range when date is sunday', () => {
    const sunday = new Date(2026, 2, 22, 9, 30, 0, 0);
    const { startMs, endMs } = getMondayWeekRangeContaining(sunday);
    expect(new Date(startMs)).toEqual(new Date(2026, 2, 16, 0, 0, 0, 0));
    expect(new Date(endMs)).toEqual(new Date(2026, 2, 22, 23, 59, 59, 999));
  });

  it('handles cross-month week boundaries', () => {
    const date = new Date(2026, 2, 1, 10, 0, 0, 0);
    const week = getMondayWeekRangeContaining(date);
    expect(new Date(week.startMs)).toEqual(new Date(2026, 1, 23, 0, 0, 0, 0));
    expect(new Date(week.endMs)).toEqual(new Date(2026, 2, 1, 23, 59, 59, 999));
  });

  it('returns previous calendar month range for February in leap year', () => {
    const marchStart = new Date(2024, 2, 1, 0, 0, 0, 0).getTime();
    const previous = getPreviousCalendarMonthRangeBefore(marchStart);
    expect(new Date(previous.startMs)).toEqual(new Date(2024, 1, 1, 0, 0, 0, 0));
    expect(new Date(previous.endMs)).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999));
  });

  it('handles cross-year month preset ranges', () => {
    const now = new Date(2026, 0, 8, 12, 0, 0, 0);
    const { current, previous } = getReviewExportPeriods(now, 'last_month');
    expect(new Date(current.startMs)).toEqual(new Date(2025, 11, 1, 0, 0, 0, 0));
    expect(new Date(current.endMs)).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
    expect(new Date(previous.startMs)).toEqual(new Date(2025, 10, 1, 0, 0, 0, 0));
    expect(new Date(previous.endMs)).toEqual(new Date(2025, 10, 30, 23, 59, 59, 999));
  });

  it('returns null for invalid week span input', () => {
    expect(getPreviousWeekRange(1000, 2000)).toBeNull();
  });

  it('keeps this_month range aligned with calendar month', () => {
    const now = new Date(2025, 1, 18);
    const { current } = getReviewExportPeriods(now, 'this_month');
    const calendar = getCalendarMonthRange(2025, 1);
    expect(current).toEqual(calendar);
  });

  it('last_month: previous period ends before current starts', () => {
    const now = new Date(2025, 2, 10);
    const { current, previous } = getReviewExportPeriods(now, 'last_month');
    expect(previous.endMs).toBeLessThan(current.startMs);
  });

  it('keeps review export period semantics stable on fixed input', () => {
    const now = new Date(2026, 2, 21, 8, 30, 0, 0);

    expect(getReviewExportPeriods(now, 'this_week')).toEqual({
      current: {
        startMs: new Date(2026, 2, 16, 0, 0, 0, 0).getTime(),
        endMs: new Date(2026, 2, 22, 23, 59, 59, 999).getTime(),
      },
      previous: {
        startMs: new Date(2026, 2, 9, 0, 0, 0, 0).getTime(),
        endMs: new Date(2026, 2, 15, 23, 59, 59, 999).getTime(),
      },
    });

    expect(getReviewExportPeriods(now, 'last_week')).toEqual({
      current: {
        startMs: new Date(2026, 2, 9, 0, 0, 0, 0).getTime(),
        endMs: new Date(2026, 2, 15, 23, 59, 59, 999).getTime(),
      },
      previous: {
        startMs: new Date(2026, 2, 2, 0, 0, 0, 0).getTime(),
        endMs: new Date(2026, 2, 8, 23, 59, 59, 999).getTime(),
      },
    });

    expect(getReviewExportPeriods(now, 'this_month')).toEqual({
      current: {
        startMs: new Date(2026, 2, 1, 0, 0, 0, 0).getTime(),
        endMs: new Date(2026, 2, 31, 23, 59, 59, 999).getTime(),
      },
      previous: {
        startMs: new Date(2026, 1, 1, 0, 0, 0, 0).getTime(),
        endMs: new Date(2026, 1, 28, 23, 59, 59, 999).getTime(),
      },
    });

    expect(getReviewExportPeriods(now, 'last_month')).toEqual({
      current: {
        startMs: new Date(2026, 1, 1, 0, 0, 0, 0).getTime(),
        endMs: new Date(2026, 1, 28, 23, 59, 59, 999).getTime(),
      },
      previous: {
        startMs: new Date(2026, 0, 1, 0, 0, 0, 0).getTime(),
        endMs: new Date(2026, 0, 31, 23, 59, 59, 999).getTime(),
      },
    });
  });
});
