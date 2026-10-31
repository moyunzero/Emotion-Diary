import { StyleSheet } from "react-native";
import { type ColorPalette, DESIGN_TOKENS } from "@/constants/colors";
import { createResponsiveMetrics } from "@/shared/responsive";

export function createRevisitBannerStyles(
  width: number,
  height: number,
  colors: ColorPalette,
) {
  const m = createResponsiveMetrics(width, height);
  const { spacing, borderRadius, fontSize } = DESIGN_TOKENS;

  return StyleSheet.create({
    banner: {
      marginHorizontal: m.padding.horizontal,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.large,
      backgroundColor: colors.background.page,
      borderWidth: 1,
      borderColor: colors.primaryLight,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    textCol: {
      flex: 1,
    },
    title: {
      fontSize: fontSize.sm,
      color: colors.text.primary,
      fontWeight: '700',
      marginBottom: 2,
    },
    subtitle: {
      fontSize: fontSize.xs,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    action: {
      alignSelf: "flex-start",
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.tab.active,
    },
    actionPressed: {
      opacity: 0.9,
    },
    actionText: {
      fontSize: fontSize.sm,
      color: colors.text.inverse,
      fontWeight: '700',
    },
  });
}

export function createWeeklyReviewBannerStyles(
  width: number,
  height: number,
  colors: ColorPalette,
) {
  const { spacing, borderRadius, fontSize } = DESIGN_TOKENS;

  return StyleSheet.create({
    banner: {
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.large,
      backgroundColor: colors.background.page,
      borderWidth: 1,
      borderColor: colors.primaryLight,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    textCol: {
      flex: 1,
    },
    title: {
      fontSize: fontSize.sm,
      color: colors.text.primary,
      fontWeight: '700',
      marginBottom: 2,
    },
    body: {
      fontSize: fontSize.xs,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    action: {
      alignSelf: "flex-start",
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.tab.active,
    },
    actionPressed: {
      opacity: 0.9,
    },
    actionText: {
      fontSize: fontSize.sm,
      color: colors.text.inverse,
      fontWeight: '700',
    },
  });
}
