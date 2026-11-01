/**
 * 陪伴天数相关类型定义
 */

import type { ColorPalette } from '@/constants/colors';

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

const MILESTONE_SPECS = [
  { days: 7, icon: "🌱", iconName: "Sprout", level: 1 },
  { days: 30, icon: "🌙", iconName: "Moon", level: 2 },
  { days: 100, icon: "💎", iconName: "Gem", level: 3 },
  { days: 365, icon: "🎉", iconName: "PartyPopper", level: 4 },
  { days: 500, icon: "⭐", iconName: "Star", level: 5 },
  { days: 1000, icon: "👑", iconName: "Crown", level: 6 },
] as const;

function milestoneColor(colors: ColorPalette, level: number): string {
  switch (level) {
    case 1:
      return colors.accent;
    case 2:
      return colors.weatherCard.cloudy.icon;
    case 3:
      return colors.weatherCard.rainy.icon;
    case 4:
      return colors.primaryDark;
    case 5:
      return colors.primary;
    case 6:
      return '#EC4899';
    default:
      return colors.primaryDark;
  }
}

/** Active-palette milestones for on-screen chrome */
export function getMilestones(colors: ColorPalette): Milestone[] {
  return MILESTONE_SPECS.map((spec) => ({
    ...spec,
    color: milestoneColor(colors, spec.level),
  }));
}
