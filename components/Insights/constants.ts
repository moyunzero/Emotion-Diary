import { COLORS as GlobalColors } from '../../constants/colors';

// Insights 专用配色（扩展全局颜色）
export const INSIGHTS_COLORS = {
  primary: GlobalColors.primary,
  secondary: GlobalColors.accent,
  accent: GlobalColors.primaryDark,
  bgStart: '#FFF5F5',
  bgEnd: '#F0FDF4',
  text: GlobalColors.text.primary,
  textSecondary: GlobalColors.text.secondary,
  cardBg: GlobalColors.background.primary,
  bloomingColor: GlobalColors.accent,
  growingColor: GlobalColors.warning,
  needWaterColor: '#FCA5A5',
} as const;
