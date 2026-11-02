/**
 * 陪伴天数服务
 * 提供陪伴天数相关的计算和格式化功能
 */

import type { ColorPalette } from '@/constants/colors';
import { MoodEntry } from '../types';
import { getMilestones, type Milestone } from '../types/companionDays';
import { excludeSoftDeletedEntries } from '@/shared/entries/visibility';

/**
 * 陪伴「首条日」取所有已知候选与未软删条目时间戳的最小值。
 * 合并/恢复云端旧日记后，必须能把已缓存的较晚 firstEntryDate 回拨到更早的日记日。
 */
export function resolveCompanionFirstEntryDate(
  knownDates: readonly (number | null | undefined)[],
  entries: readonly MoodEntry[],
): number | null {
  const candidates: number[] = [];
  for (const date of knownDates) {
    if (date != null && date > 0) candidates.push(date);
  }
  for (const entry of excludeSoftDeletedEntries(entries)) {
    if (entry.timestamp > 0) candidates.push(entry.timestamp);
  }
  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

/**
 * 回顾导出 / 陪伴展示用「第一条记录日」：
 * user 字段与本地 entries 取更早者（合并旧数据后不得被较晚的持久化值钉死）。
 */
export function getEffectiveFirstEntryDateForCompanion(
  userFirstEntryDate: number | null | undefined,
  entries: MoodEntry[],
): number | null {
  return resolveCompanionFirstEntryDate([userFirstEntryDate], entries);
}

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
 * 截至指定时刻的陪伴天数（用于回顾导出「周期末日」；首页 `calculateDays` 使用「今天」可能与导出图上的 N 不一致）
 */
export function calculateDaysAsOf(
  firstEntryDate: number | null | undefined,
  asOfMs: number,
): number {
  if (!firstEntryDate) return 0;

  const daysDiff = Math.floor(
    (asOfMs - firstEntryDate) / (1000 * 60 * 60 * 24),
  );

  return Math.max(1, daysDiff);
}

/**
 * 获取当前达到的里程碑
 * @param days 陪伴天数
 * @returns 当前达到的最高里程碑，如果未达到任何里程碑则返回null
 */
export function getMilestone(days: number, colors: ColorPalette): Milestone | null {
  const milestones = getMilestones(colors);
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (days >= milestones[i].days) {
      return milestones[i];
    }
  }
  return null;
}

/**
 * 获取下一个里程碑
 * @param days 陪伴天数
 * @returns 下一个里程碑，如果已达到最高里程碑则返回null
 */
export function getNextMilestone(days: number, colors: ColorPalette): Milestone | null {
  const milestones = getMilestones(colors);
  for (const milestone of milestones) {
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
export function getDaysToNextMilestone(days: number, colors: ColorPalette): number {
  const next = getNextMilestone(days, colors);
  return next ? next.days - days : 0;
}

/**
 * 检查是否刚达到里程碑（用于触发祝贺动画）
 * @param days 当前陪伴天数
 * @returns 如果刚好达到某个里程碑则返回该里程碑，否则返回null
 */
export function checkMilestoneAchieved(days: number, colors: ColorPalette): Milestone | null {
  return getMilestones(colors).find(m => m.days === days) || null;
}
