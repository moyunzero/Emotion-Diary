import {
  REVIEW_PRESET_LABEL,
  type ReviewExportPreset,
  getReviewExportPeriods,
  getCalendarMonthRange,
} from '../../../utils/reviewStatsTimeRange';
import { getReviewExportPeriods as getSharedReviewExportPeriods } from '../../../shared/time-range';

describe('getReviewExportPeriods', () => {
  it('re-exports preset labels for compatibility', () => {
    expect(REVIEW_PRESET_LABEL.this_week).toBe('本周');
    expect(REVIEW_PRESET_LABEL.last_month).toBe('上月');
  });

  it('this_month: current.endMs >= current.startMs', () => {
    const now = new Date(2025, 2, 15);
    const { current } = getReviewExportPeriods(now, 'this_month');
    expect(current.endMs).toBeGreaterThanOrEqual(current.startMs);
    const cal = getCalendarMonthRange(2025, 2);
    expect(current.startMs).toBe(cal.startMs);
    expect(current.endMs).toBe(cal.endMs);
  });

  it('last_month: previous ends before current starts', () => {
    const now = new Date(2025, 2, 10);
    const { current, previous } = getReviewExportPeriods(now, 'last_month');
    expect(previous.endMs).toBeLessThan(current.startMs);
  });

  it('keeps old entry and shared canonical output consistent', () => {
    const now = new Date(2026, 2, 21, 8, 30, 0, 0);
    const presets: ReviewExportPreset[] = [
      'this_week',
      'last_week',
      'this_month',
      'last_month',
    ];

    for (const preset of presets) {
      expect(getReviewExportPeriods(now, preset)).toEqual(
        getSharedReviewExportPeriods(now, preset),
      );
    }
  });

  it('keeps business semantics stable on fixed input', () => {
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
