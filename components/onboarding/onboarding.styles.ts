import { StyleSheet } from "react-native";
import { COLORS, DESIGN_TOKENS } from "@/constants/colors";
import { createResponsiveMetrics } from "@/shared/responsive";

export function createOnboardingStyles(width: number, height: number) {
  const m = createResponsiveMetrics(width, height);
  const { spacing, borderRadius, fontSize, iconSize } = DESIGN_TOKENS;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: COLORS.background.page,
    },
    content: {
      flex: 1,
      paddingHorizontal: m.padding.horizontal,
      justifyContent: "center",
      alignItems: "center",
    },
    slide: {
      width: "100%",
      alignItems: "center",
      gap: spacing.lg,
    },
    iconContainer: {
      width: iconSize.xxl * 2,
      height: iconSize.xxl * 2,
      borderRadius: borderRadius.full,
      backgroundColor: COLORS.background.primary,
      borderWidth: 1,
      borderColor: COLORS.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
      ...DESIGN_TOKENS.shadow.md,
    },
    title: {
      fontSize: fontSize.xl,
      color: COLORS.text.primary,
      fontFamily: "Lato_700Bold",
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    body: {
      fontSize: fontSize.md,
      color: COLORS.text.secondary,
      fontFamily: "Lato_400Regular",
      textAlign: "center",
      lineHeight: 24,
      maxWidth: 320,
    },
    footer: {
      paddingHorizontal: m.padding.horizontal,
      paddingBottom: spacing.xxxl,
      gap: spacing.lg,
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.sm,
    },
    dot: {
      width: spacing.sm,
      height: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: COLORS.primaryLight,
    },
    dotActive: {
      backgroundColor: COLORS.primaryDark,
      width: spacing.lg,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    skipButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    skipText: {
      fontSize: fontSize.base,
      color: COLORS.text.tertiary,
      fontFamily: "Lato_400Regular",
    },
    primaryButton: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.large,
      backgroundColor: COLORS.primaryDark,
      alignItems: "center",
      justifyContent: "center",
      ...DESIGN_TOKENS.shadow.md,
    },
    primaryButtonPressed: {
      opacity: 0.92,
    },
    primaryButtonText: {
      fontSize: fontSize.md,
      color: COLORS.text.inverse,
      fontFamily: "Lato_700Bold",
    },
  });
}
