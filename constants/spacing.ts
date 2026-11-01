/**
 * 间距 / 圆角 / 字号兼容层
 * 单一真源：`DESIGN_TOKENS`（constants/colors.ts）。本文件仅 re-export / 显式别名。
 *
 * Pitfall 1 / D-07·D-08: `SPACING.md` 保持 16，而 `DESIGN_TOKENS.spacing.md` 为 12
 *（VISUAL 卡间距）。二者故意不等，勿静默统一。
 */

import { DESIGN_TOKENS } from './colors';

export const SPACING = {
  xs: DESIGN_TOKENS.spacing.xs,
  sm: DESIGN_TOKENS.spacing.sm,
  /** Intentionally 16 — not DESIGN_TOKENS.spacing.md (12). */
  md: 16,
  lg: DESIGN_TOKENS.spacing.xxl,
  xl: DESIGN_TOKENS.spacing.xxxl,
  xxl: DESIGN_TOKENS.spacing.huge,
} as const;

export const BORDER_RADIUS = {
  sm: DESIGN_TOKENS.borderRadius.xs,
  md: DESIGN_TOKENS.borderRadius.small,
  lg: DESIGN_TOKENS.borderRadius.medium,
  xl: DESIGN_TOKENS.borderRadius.xl,
  full: DESIGN_TOKENS.borderRadius.full,
} as const;

export const FONT_SIZE = {
  xs: DESIGN_TOKENS.fontSize.xs,
  sm: DESIGN_TOKENS.fontSize.base,
  md: DESIGN_TOKENS.fontSize.md,
  lg: DESIGN_TOKENS.fontSize.lg,
  xl: DESIGN_TOKENS.fontSize.xl,
  xxl: DESIGN_TOKENS.fontSize.xxl,
  xxxl: DESIGN_TOKENS.fontSize.xxxl,
} as const;

export const FONT_WEIGHT = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const LINE_HEIGHT = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;
