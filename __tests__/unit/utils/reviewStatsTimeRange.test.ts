/**
 * 使用本地日期构造，避免仅依赖 ISO 字符串解析（时区差异）。
 */

import {
  getCalendarMonthRange,
  getMondayWeekRangeContaining,
  getPreviousCalendarMonthRangeBefore,
  getPreviousWeekRange,
} from '../../../utils/reviewStatsTimeRange';

describe('reviewStatsTimeRange', () => {
  describe('getCalendarMonthRange', () => {
    it('returns March 2025 local month bounds', () => {
      const { startMs, endMs } = getCalendarMonthRange(2025, 2);
      const start = new Date(startMs);
      const end = new Date(endMs);
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(2);
      expect(start.getDate()).toBe(1);
      expect(end.getMonth()).toBe(2);
      expect(end.getDate()).toBe(31);
    });
  });

  describe('getMondayWeekRangeContaining', () => {
    it('week containing 2025-03-21 (local) starts Monday 2025-03-17', () => {
      const friday = new Date(2025, 2, 21, 15, 0, 0, 0);
      const { startMs, endMs } = getMondayWeekRangeContaining(friday);
      const monday = new Date(startMs);
      expect(monday.getFullYear()).toBe(2025);
      expect(monday.getMonth()).toBe(2);
      expect(monday.getDate()).toBe(17);
      expect(monday.getDay()).toBe(1);
      const sunday = new Date(endMs);
      expect(sunday.getDate()).toBe(23);
    });
  });

  describe('getPreviousCalendarMonthRangeBefore', () => {
    it('returns February 2025 when start is March 2025', () => {
      const marchStart = new Date(2025, 2, 1, 0, 0, 0, 0).getTime();
      const { startMs, endMs } = getPreviousCalendarMonthRangeBefore(marchStart);
      expect(new Date(startMs).getMonth()).toBe(1);
      expect(new Date(startMs).getDate()).toBe(1);
      expect(new Date(endMs).getMonth()).toBe(1);
      expect(new Date(endMs).getDate()).toBe(28);
    });
  });

  describe('getPreviousWeekRange', () => {
    it('returns null when span is not week-like', () => {
      expect(getPreviousWeekRange(0, 86400000)).toBeNull();
    });

    it('returns previous week when given a standard week span', () => {
      const cur = getMondayWeekRangeContaining(new Date(2025, 2, 21));
      const prev = getPreviousWeekRange(cur.startMs, cur.endMs);
      expect(prev).not.toBeNull();
      expect(prev!.endMs).toBe(cur.startMs - 1);
      expect(prev!.startMs).toBe(cur.startMs - 7 * 86400000);
    });
  });
});
