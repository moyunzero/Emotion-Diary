import {
  getReviewExportPeriods,
  getCalendarMonthRange,
} from '../../../utils/reviewStatsTimeRange';

describe('getReviewExportPeriods', () => {
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
});
