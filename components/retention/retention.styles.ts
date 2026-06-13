import { StyleSheet } from "react-native";
import { COLORS, DESIGN_TOKENS } from "@/constants/colors";
import { createResponsiveMetrics } from "@/shared/responsive";

export function createRevisitBannerStyles(width: number, height: number) {
  const m = createResponsiveMetrics(width, height);
  const { spacing, borderRadius, fontSize } = DESIGN_TOKENS;

  return StyleSheet.create({
    banner: {
      marginHorizontal: m.padding.horizontal,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.large,
      backgroundColor: "#FEF2F2",
      borderWidth: 1,
      borderColor: "#FECACA",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: fontSize.sm,
      color: COLORS.text.primary,
      fontFamily: "Lato_700Bold",
    },
    action: {
      alignSelf: "flex-start",
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.medium,
      backgroundColor: "#EF4444",
    },
    actionPressed: {
      opacity: 0.9,
    },
    actionText: {
      fontSize: fontSize.sm,
      color: "#FFFFFF",
      fontFamily: "Lato_700Bold",
    },
  });
}

export function createWeeklyReviewBannerStyles(width: number, height: number) {
  const { spacing, borderRadius, fontSize } = DESIGN_TOKENS;

  return StyleSheet.create({
    banner: {
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.large,
      backgroundColor: "#EFF6FF",
      borderWidth: 1,
      borderColor: "#BFDBFE",
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
      color: COLORS.text.primary,
      fontFamily: "Lato_700Bold",
      marginBottom: 2,
    },
    body: {
      fontSize: fontSize.xs,
      color: COLORS.text.secondary,
      lineHeight: 18,
    },
    action: {
      alignSelf: "flex-start",
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.medium,
      backgroundColor: "#3B82F6",
    },
    actionPressed: {
      opacity: 0.9,
    },
    actionText: {
      fontSize: fontSize.sm,
      color: "#FFFFFF",
      fontFamily: "Lato_700Bold",
    },
  });
}
