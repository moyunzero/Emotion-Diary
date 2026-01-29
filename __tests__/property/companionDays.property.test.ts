/**
 * 陪伴天数服务属性测试
 * Feature: companion-days-optimization
 */

import * as fc from 'fast-check';
import {
    calculateDays,
    formatStartDate,
    getDaysToNextMilestone,
    getMilestone,
    getNextMilestone,
} from '../../services/companionDaysService';
import { MILESTONES } from '../../types/companionDays';

describe('CompanionDaysService Property Tests', () => {
  /**
   * Property 6: calculateDays函数正确计算天数
   * 验证: 需求 2.2, 2.5
   */
  describe('Property 6: calculateDays correctly calculates days', () => {
    it('should return 0 for null or undefined', () => {
      fc.assert(
        fc.property(fc.constantFrom(null, undefined), (input) => {
          expect(calculateDays(input)).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return at least 1 for any valid timestamp', () => {
      // 生成过去0-2000天的时间戳
      const arbPastTimestamp = fc.integer({ min: 0, max: 2000 }).map(days => {
        return Date.now() - days * 24 * 60 * 60 * 1000;
      });

      fc.assert(
        fc.property(arbPastTimestamp, (timestamp) => {
          const days = calculateDays(timestamp);
          expect(days).toBeGreaterThanOrEqual(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should calculate correct number of days', () => {
      // 生成过去1-2000天的时间戳
      const arbPastTimestamp = fc.integer({ min: 1, max: 2000 }).map(days => {
        return Date.now() - days * 24 * 60 * 60 * 1000;
      });

      fc.assert(
        fc.property(arbPastTimestamp, (timestamp) => {
          const now = Date.now();
          const expectedDays = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
          const actualDays = calculateDays(timestamp);
          
          // 至少为1天
          const expected = Math.max(1, expectedDays);
          expect(actualDays).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: formatStartDate正确格式化日期
   * 验证: 需求 5.2
   */
  describe('Property 10: formatStartDate correctly formats dates', () => {
    it('should format date as "YYYY年M月D日"', () => {
      // 生成随机时间戳（2020-2025年）
      const arbTimestamp = fc.integer({
        min: new Date('2020-01-01').getTime(),
        max: new Date('2025-12-31').getTime(),
      });

      fc.assert(
        fc.property(arbTimestamp, (timestamp) => {
          const formatted = formatStartDate(timestamp);
          const date = new Date(timestamp);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const expected = `${year}年${month}月${day}日`;
          
          expect(formatted).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge dates correctly', () => {
      // 测试特殊日期：年初、年末、闰年2月29日
      const edgeDates = [
        new Date('2024-01-01').getTime(),
        new Date('2024-12-31').getTime(),
        new Date('2024-02-29').getTime(), // 闰年
        new Date('2023-02-28').getTime(), // 非闰年
      ];

      edgeDates.forEach(timestamp => {
        const formatted = formatStartDate(timestamp);
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const expected = `${year}年${month}月${day}日`;
        
        expect(formatted).toBe(expected);
      });
    });
  });

  /**
   * Property 11: getDaysToNextMilestone正确计算剩余天数
   * 验证: 需求 5.3
   */
  describe('Property 11: getDaysToNextMilestone correctly calculates remaining days', () => {
    it('should return correct days to next milestone', () => {
      // 生成0-999天的随机天数（不包括最高里程碑）
      const arbDays = fc.integer({ min: 0, max: 999 });

      fc.assert(
        fc.property(arbDays, (days) => {
          const nextMilestone = getNextMilestone(days);
          const daysToNext = getDaysToNextMilestone(days);
          
          if (nextMilestone) {
            expect(daysToNext).toBe(nextMilestone.days - days);
            expect(daysToNext).toBeGreaterThan(0);
          } else {
            expect(daysToNext).toBe(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return 0 for days >= highest milestone', () => {
      // 生成1000天以上的随机天数
      const arbHighDays = fc.integer({ min: 1000, max: 5000 });

      fc.assert(
        fc.property(arbHighDays, (days) => {
          const daysToNext = getDaysToNextMilestone(days);
          expect(daysToNext).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 额外的属性测试：里程碑一致性
   */
  describe('Milestone consistency properties', () => {
    it('getMilestone should return null for days < 7', () => {
      const arbLowDays = fc.integer({ min: 0, max: 6 });

      fc.assert(
        fc.property(arbLowDays, (days) => {
          const milestone = getMilestone(days);
          expect(milestone).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('getMilestone should return highest achieved milestone', () => {
      const arbDays = fc.integer({ min: 7, max: 2000 });

      fc.assert(
        fc.property(arbDays, (days) => {
          const milestone = getMilestone(days);
          
          if (milestone) {
            // 应该达到这个里程碑
            expect(days).toBeGreaterThanOrEqual(milestone.days);
            
            // 不应该达到下一个里程碑（如果存在）
            const milestoneIndex = MILESTONES.findIndex(m => m.days === milestone.days);
            if (milestoneIndex < MILESTONES.length - 1) {
              const nextMilestone = MILESTONES[milestoneIndex + 1];
              expect(days).toBeLessThan(nextMilestone.days);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('getNextMilestone should return the immediate next milestone', () => {
      const arbDays = fc.integer({ min: 0, max: 999 });

      fc.assert(
        fc.property(arbDays, (days) => {
          const nextMilestone = getNextMilestone(days);
          
          if (nextMilestone) {
            // 应该未达到这个里程碑
            expect(days).toBeLessThan(nextMilestone.days);
            
            // 不应该有更近的里程碑
            const allCloserMilestones = MILESTONES.filter(
              m => m.days > days && m.days < nextMilestone.days
            );
            expect(allCloserMilestones).toHaveLength(0);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
