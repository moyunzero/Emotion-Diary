/**
 * 栈式顶栏容器样式（StackScreenHeader 外层）
 * Profile / 记录 / 回收站等共用，保证返回箭头与内容区左缘对齐。
 */

import { StyleSheet, type ViewStyle } from "react-native";
import { COLORS, DESIGN_TOKENS } from "../constants/colors";
import { createResponsiveMetrics } from "../shared/responsive";

export function createStackScreenHeaderStyle(
  width: number,
  height: number,
): ViewStyle {
  const m = createResponsiveMetrics(width, height);
  const { spacing } = DESIGN_TOKENS;

  return {
    paddingHorizontal: m.padding.horizontal,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.light,
  };
}
