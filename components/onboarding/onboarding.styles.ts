import { StyleSheet } from "react-native";
import { type ColorPalette, DESIGN_TOKENS } from "@/constants/colors";
import { createResponsiveMetrics } from "@/shared/responsive";

export function createOnboardingStyles(
  width: number,
  height: number,
  colors: ColorPalette,
) {
  const m = createResponsiveMetrics(width, height);
  const { spacing, borderRadius, fontSize, iconSize } = DESIGN_TOKENS;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background.page,
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
      backgroundColor: colors.background.primary,
      borderWidth: 1,
      borderColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
      ...DESIGN_TOKENS.shadow.md,
    },
    title: {
      fontSize: fontSize.xl,
      color: colors.text.primary,
      fontWeight: '700',
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    body: {
      fontSize: fontSize.md,
      color: colors.text.secondary,
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
      backgroundColor: colors.primaryLight,
    },
    dotActive: {
      backgroundColor: colors.primaryDark,
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
      color: colors.text.tertiary,
    },
    primaryButton: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.large,
      backgroundColor: colors.primaryDark,
      alignItems: "center",
      justifyContent: "center",
      ...DESIGN_TOKENS.shadow.md,
    },
    primaryButtonPressed: {
      opacity: 0.92,
    },
    primaryButtonText: {
      fontSize: fontSize.md,
      color: colors.text.inverse,
      fontWeight: '700',
    },
  });
}
