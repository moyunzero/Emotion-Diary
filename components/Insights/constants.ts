import {
  COLORS_LIGHT,
  type ColorPalette,
} from '../../constants/colors';

export type InsightsColors = {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly bgStart: string;
  readonly bgEnd: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly cardBg: string;
  readonly bloomingColor: string;
  readonly growingColor: string;
  readonly needWaterColor: string;
};

/** Runtime palette for on-screen Insights UI (NIGHT-02 / Pattern 4). */
export function getInsightsColors(colors: ColorPalette): InsightsColors {
  return {
    primary: colors.brand,
    secondary: colors.brand,
    accent: colors.brandPressed,
    bgStart: colors.bg,
    bgEnd: colors.surface2,
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    cardBg: colors.surface,
    bloomingColor: colors.ritual.resolve,
    growingColor: colors.ritual.burn,
    needWaterColor: colors.brandPressed,
  };
}

/** Light-only alias for share/export capture paths (D-06 KNOWN_EXCEPTIONS). */
export const INSIGHTS_COLORS: InsightsColors = getInsightsColors(COLORS_LIGHT);
