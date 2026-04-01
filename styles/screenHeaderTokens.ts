/**
 * 栈式页面顶栏令牌（Phase 15）
 * 与 Phase 14「非模版化」分工：此处仅结构/尺寸/默认色，不约束各屏内容区视觉隐喻。
 */

import { COLORS, DESIGN_TOKENS } from '../constants/colors';

export const SCREEN_HEADER_TOKENS = {
  backIconSize: DESIGN_TOKENS.iconSize.lg,
  backHitSlop: 12,
  minTouchTarget: 44,
  titleFontSize: DESIGN_TOKENS.fontSize.lg,
  titleColor: COLORS.text.primary,
  backIconColor: COLORS.gray[500],
  sideSlotWidth: 40,
} as const;

export type ScreenHeaderTokens = typeof SCREEN_HEADER_TOKENS;
