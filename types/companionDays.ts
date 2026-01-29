/**
 * 陪伴天数相关类型定义
 */

/**
 * 里程碑接口
 */
export interface Milestone {
  days: number;           // 里程碑天数
  title: string;          // 标题，如"初识七日"
  description: string;    // 描述，如"我们已经相伴7天了"
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
    title: "初识七日",
    description: "我们已经相伴7天了",
    icon: "🌱",
    iconName: "Sprout",
    color: "#10B981",
    level: 1,
  },
  {
    days: 30,
    title: "满月之约",
    description: "一个月的陪伴",
    icon: "🌙",
    iconName: "Moon",
    color: "#3B82F6",
    level: 2,
  },
  {
    days: 100,
    title: "百日之诺",
    description: "100天的坚持",
    icon: "💎",
    iconName: "Gem",
    color: "#8B5CF6",
    level: 3,
  },
  {
    days: 365,
    title: "周年纪念",
    description: "整整一年的陪伴",
    icon: "🎉",
    iconName: "PartyPopper",
    color: "#F59E0B",
    level: 4,
  },
  {
    days: 500,
    title: "长久相伴",
    description: "500天的情绪旅程",
    icon: "⭐",
    iconName: "Star",
    color: "#EF4444",
    level: 5,
  },
  {
    days: 1000,
    title: "千日传奇",
    description: "1000天的不离不弃",
    icon: "👑",
    iconName: "Crown",
    color: "#EC4899",
    level: 6,
  },
];
