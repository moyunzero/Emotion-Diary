import {
  formatDateChinese,
  formatMonthDay,
  formatRelativeDayLabel,
} from '../../../../shared/formatting/date';

describe('shared/formatting/date', () => {
  describe('formatDateChinese', () => {
    it('returns fallback for nullish input', () => {
      expect(formatDateChinese(null)).toBe('日期未知');
      expect(formatDateChinese(undefined)).toBe('日期未知');
    });

    it('formats leap-year date correctly', () => {
      const date = new Date(2024, 1, 29);
      expect(formatDateChinese(date)).toBe('2024年2月29日');
    });

    it('formats cross-year boundary correctly', () => {
      const date = new Date(2025, 11, 31);
      expect(formatDateChinese(date)).toBe('2025年12月31日');
    });
  });

  describe('formatMonthDay', () => {
    it('returns fallback for invalid input', () => {
      expect(formatMonthDay(null)).toBe('--/--');
    });

    it('formats month/day semantics consistently', () => {
      const date = new Date(2026, 0, 1);
      expect(formatMonthDay(date)).toBe('1/1');
    });
  });

  describe('formatRelativeDayLabel', () => {
    const now = new Date(2026, 2, 21, 10, 0, 0, 0);

    it('returns relative label for today/yesterday/tomorrow', () => {
      expect(formatRelativeDayLabel(new Date(2026, 2, 21, 23), now)).toBe('今天');
      expect(formatRelativeDayLabel(new Date(2026, 2, 20, 8), now)).toBe('昨天');
      expect(formatRelativeDayLabel(new Date(2026, 2, 22, 9), now)).toBe('明天');
    });

    it('returns stable fallback for null input', () => {
      expect(formatRelativeDayLabel(null, now)).toBe('未知时间');
    });

    it('handles cross-month and cross-year deltas', () => {
      expect(formatRelativeDayLabel(new Date(2026, 1, 28), now)).toBe('21天前');
      expect(formatRelativeDayLabel(new Date(2025, 11, 31), now)).toBe('80天前');
    });
  });
});
