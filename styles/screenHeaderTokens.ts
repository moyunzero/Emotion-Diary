/**
 * 栈式页面顶栏令牌（Phase 15）
 * 与 Phase 14「非模版化」分工：此处仅结构/尺寸/默认色，不约束各屏内容区视觉隐喻。
 */

import {
  COLORS_LIGHT,
  DESIGN_TOKENS,
  type ColorPalette,
} from '../constants/colors';

export function getScreenHeaderTokens(colors: ColorPalette) {
  return {
    backIconSize: DESIGN_TOKENS.iconSize.lg,
    backHitSlop: 12,
    minTouchTarget: 44,
    titleFontSize: DESIGN_TOKENS.fontSize.lg,
    titleColor: colors.text.primary,
    backIconColor: colors.gray[500],
    sideSlotWidth: 40,
  } as const;
}

/** @deprecated Use getScreenHeaderTokens(getColors(scheme)) via useThemeStyles */
export const SCREEN_HEADER_TOKENS = getScreenHeaderTokens(COLORS_LIGHT);

export type ScreenHeaderTokens = ReturnType<typeof getScreenHeaderTokens>;
