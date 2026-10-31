import { StyleSheet } from "react-native";
import { type ColorPalette, DESIGN_TOKENS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";

export function createSettingsStyles(
  _width: number,
  _height: number,
  colors: ColorPalette,
) {
  const { spacing, borderRadius, fontSize, shadow } = DESIGN_TOKENS;

  return StyleSheet.create({
    footnote: {
      fontSize: fontSize.xs,
      color: colors.text.tertiary,
      lineHeight: 18,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    groupedCard: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.xl,
      overflow: "hidden",
      marginBottom: SPACING.xxl,
      ...shadow.md,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.lg,
    },
    statusText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.text.secondary,
    },
    statusIcon: {
      marginRight: spacing.sm,
    },
    groupDivider: {
      height: 1,
      backgroundColor: colors.gray[100],
      marginLeft: spacing.lg,
    },
  });
}
