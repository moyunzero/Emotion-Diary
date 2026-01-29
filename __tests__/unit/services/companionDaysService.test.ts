/**
 * 陪伴天数服务单元测试
 */

import {
    calculateDays,
    checkMilestoneAchieved,
    formatStartDate,
    getDaysToNextMilestone,
    getMilestone,
    getNextMilestone,
} from '../../../services/companionDaysService';
import { MILESTONES } from '../../../types/companionDays';

describe('CompanionDaysService', () => {
  describe('calculateDays', () => {
    it('should return 0 for null', () => {
      expect(calculateDays(null)).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(calculateDays(undefined)).toBe(0);
    });

    it('should return 1 for today', () => {
      const today = Date.now();
      expect(calculateDays(today)).toBe(1);
    });

    it('should return 1 for a few hours ago', () => {
      const hoursAgo = Date.now() - 5 * 60 * 60 * 1000; // 5 hours ago
      expect(calculateDays(hoursAgo)).toBe(1);
    });

    it('should calculate correct days for past dates', () => {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      expect(calculateDays(sevenDaysAgo)).toBe(7);

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      expect(calculateDays(thirtyDaysAgo)).toBe(30);

      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      expect(calculateDays(oneYearAgo)).toBe(365);
    });

    it('should handle large numbers of days', () => {
      const thousandDaysAgo = Date.now() - 1000 * 24 * 60 * 60 * 1000;
      expect(calculateDays(thousandDaysAgo)).toBe(1000);
    });
  });

  describe('getMilestone', () => {
    it('should return null for days < 7', () => {
      expect(getMilestone(0)).toBeNull();
      expect(getMilestone(6)).toBeNull();
    });

    it('should return first milestone for 7 days', () => {
      const milestone = getMilestone(7);
      expect(milestone).not.toBeNull();
      expect(milestone?.days).toBe(7);
      expect(milestone?.title).toBe('初识七日');
    });

    it('should return correct milestone for boundary values', () => {
      // 测试每个里程碑的边界值
      expect(getMilestone(7)?.days).toBe(7);
      expect(getMilestone(29)?.days).toBe(7);
      expect(getMilestone(30)?.days).toBe(30);
      expect(getMilestone(99)?.days).toBe(30);
      expect(getMilestone(100)?.days).toBe(100);
      expect(getMilestone(364)?.days).toBe(100);
      expect(getMilestone(365)?.days).toBe(365);
      expect(getMilestone(499)?.days).toBe(365);
      expect(getMilestone(500)?.days).toBe(500);
      expect(getMilestone(999)?.days).toBe(500);
      expect(getMilestone(1000)?.days).toBe(1000);
    });

    it('should return highest milestone for days > 1000', () => {
      const milestone = getMilestone(2000);
      expect(milestone).not.toBeNull();
      expect(milestone?.days).toBe(1000);
      expect(milestone?.title).toBe('千日传奇');
    });
  });

  describe('getNextMilestone', () => {
    it('should return first milestone for days < 7', () => {
      const next = getNextMilestone(0);
      expect(next).not.toBeNull();
      expect(next?.days).toBe(7);
    });

    it('should return correct next milestone', () => {
      expect(getNextMilestone(7)?.days).toBe(30);
      expect(getNextMilestone(30)?.days).toBe(100);
      expect(getNextMilestone(100)?.days).toBe(365);
      expect(getNextMilestone(365)?.days).toBe(500);
      expect(getNextMilestone(500)?.days).toBe(1000);
    });

    it('should return null for days >= 1000', () => {
      expect(getNextMilestone(1000)).toBeNull();
      expect(getNextMilestone(2000)).toBeNull();
    });
  });

  describe('getDaysToNextMilestone', () => {
    it('should return correct days to next milestone', () => {
      expect(getDaysToNextMilestone(0)).toBe(7);
      expect(getDaysToNextMilestone(5)).toBe(2);
      expect(getDaysToNextMilestone(7)).toBe(23); // 30 - 7
      expect(getDaysToNextMilestone(50)).toBe(50); // 100 - 50
      expect(getDaysToNextMilestone(200)).toBe(165); // 365 - 200
    });

    it('should return 0 for days >= 1000', () => {
      expect(getDaysToNextMilestone(1000)).toBe(0);
      expect(getDaysToNextMilestone(2000)).toBe(0);
    });
  });

  describe('formatStartDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15').getTime();
      expect(formatStartDate(date)).toBe('2024年1月15日');
    });

    it('should handle single digit months and days', () => {
      const date = new Date('2024-03-05').getTime();
      expect(formatStartDate(date)).toBe('2024年3月5日');
    });

    it('should handle double digit months and days', () => {
      const date = new Date('2024-12-31').getTime();
      expect(formatStartDate(date)).toBe('2024年12月31日');
    });

    it('should handle leap year dates', () => {
      const date = new Date('2024-02-29').getTime();
      expect(formatStartDate(date)).toBe('2024年2月29日');
    });
  });

  describe('checkMilestoneAchieved', () => {
    it('should return milestone when exactly at milestone days', () => {
      MILESTONES.forEach(milestone => {
        const result = checkMilestoneAchieved(milestone.days);
        expect(result).not.toBeNull();
        expect(result?.days).toBe(milestone.days);
      });
    });

    it('should return null when not at milestone days', () => {
      expect(checkMilestoneAchieved(6)).toBeNull();
      expect(checkMilestoneAchieved(8)).toBeNull();
      expect(checkMilestoneAchieved(29)).toBeNull();
      expect(checkMilestoneAchieved(31)).toBeNull();
      expect(checkMilestoneAchieved(99)).toBeNull();
      expect(checkMilestoneAchieved(101)).toBeNull();
    });
  });
});
