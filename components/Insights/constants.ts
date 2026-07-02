import { COLORS as GlobalColors } from '../../constants/colors';

// Insights 专用配色（扩展全局颜色）
export const INSIGHTS_COLORS = {
  primary: GlobalColors.primary,
  /** 装饰 icon / 进度环 / 轻强调（粉系，非 accent 绿） */
  secondary: GlobalColors.primary,
  accent: GlobalColors.primaryDark,
  bgStart: GlobalColors.background.gradientStart,
  bgEnd: GlobalColors.background.gradientEnd,
  text: GlobalColors.text.primary,
  textSecondary: GlobalColors.text.secondary,
  cardBg: GlobalColors.background.primary,
  /** 关系花盆「盛开」语义，仅此场景保留生长绿 */
  bloomingColor: GlobalColors.accent,
  growingColor: GlobalColors.warning,
  needWaterColor: GlobalColors.primaryDark,
} as const;
