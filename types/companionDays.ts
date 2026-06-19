/**
 * 陪伴天数相关类型定义
 */

/**
 * 里程碑接口
 */
export interface Milestone {
  days: number;           // 里程碑天数
  icon: string;           // 图标emoji，如"🌱" (保留用于向后兼容)
  iconName: string;       // 矢量图标名称，如"Sprout"
  color: string;          // 主题色，如"#10B981"
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
    color: "#10B981",
    level: 1,
  },
  {
    days: 30,
    icon: "🌙",
    iconName: "Moon",
    color: "#3B82F6",
    level: 2,
  },
  {
    days: 100,
    icon: "💎",
    iconName: "Gem",
    color: "#8B5CF6",
    level: 3,
  },
  {
    days: 365,
    icon: "🎉",
    iconName: "PartyPopper",
    color: "#F59E0B",
    level: 4,
  },
  {
    days: 500,
    icon: "⭐",
    iconName: "Star",
    color: "#EF4444",
    level: 5,
  },
  {
    days: 1000,
    icon: "👑",
    iconName: "Crown",
    color: "#EC4899",
    level: 6,
  },
];
