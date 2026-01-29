/**
 * 陪伴天数服务
 * 提供陪伴天数相关的计算和格式化功能
 */

import { Milestone, MILESTONES } from '../types/companionDays';

/**
 * 计算陪伴天数
 * @param firstEntryDate 第一条记录的时间戳（毫秒），如果为null或undefined则返回0
 * @returns 陪伴天数，至少为1（如果firstEntryDate是今天）
 */
export function calculateDays(firstEntryDate: number | null | undefined): number {
  if (!firstEntryDate) return 0;
  
  const now = Date.now();
  const daysDiff = Math.floor((now - firstEntryDate) / (1000 * 60 * 60 * 24));
  
  // 至少显示1天（如果是今天创建的）
  return Math.max(1, daysDiff);
}

/**
 * 获取当前达到的里程碑
 * @param days 陪伴天数
 * @returns 当前达到的最高里程碑，如果未达到任何里程碑则返回null
 */
export function getMilestone(days: number): Milestone | null {
  // 从高到低查找已达到的里程碑
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (days >= MILESTONES[i].days) {
      return MILESTONES[i];
    }
  }
  return null;
}

/**
 * 获取下一个里程碑
 * @param days 陪伴天数
 * @returns 下一个里程碑，如果已达到最高里程碑则返回null
 */
export function getNextMilestone(days: number): Milestone | null {
  for (const milestone of MILESTONES) {
    if (days < milestone.days) {
      return milestone;
    }
  }
  return null;
}

/**
 * 计算距离下一个里程碑的天数
 * @param days 当前陪伴天数
 * @returns 距离下一个里程碑的天数，如果已达到最高里程碑则返回0
 */
export function getDaysToNextMilestone(days: number): number {
  const next = getNextMilestone(days);
  return next ? next.days - days : 0;
}

/**
 * 格式化开始日期
 * @param timestamp 时间戳（毫秒）
 * @returns 格式化的日期字符串，如"2024年1月15日"
 */
export function formatStartDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * 检查是否刚达到里程碑（用于触发祝贺动画）
 * @param days 当前陪伴天数
 * @returns 如果刚好达到某个里程碑则返回该里程碑，否则返回null
 */
export function checkMilestoneAchieved(days: number): Milestone | null {
  return MILESTONES.find(m => m.days === days) || null;
}
