/**
 * 日期工具函数测试
 */

import { ensureMilliseconds } from '../../../utils/dateUtils';

describe('dateUtils', () => {
  describe('ensureMilliseconds', () => {
    it('should keep milliseconds timestamp unchanged', () => {
      const milliseconds = 1705564800000; // 2024-01-18 00:00:00
      expect(ensureMilliseconds(milliseconds)).toBe(milliseconds);
    });

    it('should convert seconds to milliseconds', () => {
      const seconds = 1705564800; // 2024-01-18 00:00:00 in seconds
      const expected = 1705564800000;
      expect(ensureMilliseconds(seconds)).toBe(expected);
    });

    it('should handle zero', () => {
      expect(ensureMilliseconds(0)).toBe(0);
    });

    it('should handle negative values', () => {
      const negativeSeconds = -1705564800;
      const expected = -1705564800000;
      expect(ensureMilliseconds(negativeSeconds)).toBe(expected);
    });

    it('should detect seconds correctly (< 10000000000)', () => {
      const seconds = 9999999999; // Just below the threshold
      const expected = 9999999999000;
      expect(ensureMilliseconds(seconds)).toBe(expected);
    });

    it('should detect milliseconds correctly (>= 10000000000)', () => {
      const milliseconds = 10000000000; // Just at the threshold
      expect(ensureMilliseconds(milliseconds)).toBe(milliseconds);
    });

    it('should handle current timestamp', () => {
      const now = Date.now();
      expect(ensureMilliseconds(now)).toBe(now);
    });

    it('should handle timestamp from 1970', () => {
      const timestamp1970 = 0;
      expect(ensureMilliseconds(timestamp1970)).toBe(0);
    });

    it('should handle timestamp from 2000', () => {
      const timestamp2000 = 946684800; // 2000-01-01 in seconds
      const expected = 946684800000;
      expect(ensureMilliseconds(timestamp2000)).toBe(expected);
    });

    it('should handle timestamp from 2030', () => {
      const timestamp2030 = 1893456000; // 2030-01-01 in seconds
      const expected = 1893456000000;
      expect(ensureMilliseconds(timestamp2030)).toBe(expected);
    });
  });
});
