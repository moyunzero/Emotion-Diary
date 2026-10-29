import { COLORS as GlobalColors } from '../../constants/colors';

// Insights 专用配色 — 语义键薄映射（D-04）；保留 export 名稳定 share/ReviewExport
export const INSIGHTS_COLORS = {
  primary: GlobalColors.brand,
  /** 装饰 icon / 进度环 / 轻强调（粉系，非 accent 绿） */
  secondary: GlobalColors.brand,
  accent: GlobalColors.brandPressed,
  bgStart: GlobalColors.bg,
  bgEnd: GlobalColors.surface2,
  text: GlobalColors.text.primary,
  textSecondary: GlobalColors.text.secondary,
  cardBg: GlobalColors.surface,
  /** 关系花盆「盛开」语义，仅此场景保留生长绿 */
  bloomingColor: GlobalColors.ritual.resolve,
  growingColor: GlobalColors.ritual.burn,
  needWaterColor: GlobalColors.brandPressed,
} as const;
