/**
 * 陪伴天数相关类型定义
 */

import { COLORS } from '@/constants/colors';

/**
 * 里程碑接口
 */
export interface Milestone {
  days: number;           // 里程碑天数
  icon: string;           // 图标emoji，如"🌱" (保留用于向后兼容)
  iconName: string;       // 矢量图标名称，如"Sprout"
  color: string;          // 主题色（粉/紫/橙粉系）
  level: number;          // 等级，1-6
}

/**
 * 里程碑常量定义
 */
export const MILESTONES: Milestone[] = [
  {
    days: 7,
    icon: "🌱",
    iconName: "Sprout",
    color: COLORS.accent,
    level: 1,
  },
  {
    days: 30,
    icon: "🌙",
    iconName: "Moon",
    color: COLORS.weatherCard.cloudy.icon,
    level: 2,
  },
  {
    days: 100,
    icon: "💎",
    iconName: "Gem",
    color: COLORS.weatherCard.rainy.icon,
    level: 3,
  },
  {
    days: 365,
    icon: "🎉",
    iconName: "PartyPopper",
    color: COLORS.primaryDark,
    level: 4,
  },
  {
    days: 500,
    icon: "⭐",
    iconName: "Star",
    color: COLORS.primary,
    level: 5,
  },
  {
    days: 1000,
    icon: "👑",
    iconName: "Crown",
    color: '#EC4899',
    level: 6,
  },
];
