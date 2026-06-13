import { StyleSheet } from "react-native";
import { COLORS, DESIGN_TOKENS } from "@/constants/colors";
import { createResponsiveMetrics } from "@/shared/responsive";
import { createStackScreenHeaderStyle } from "@/styles/stackScreenHeader";

export function createRecycleBinStyles(width: number, height: number) {
  const m = createResponsiveMetrics(width, height);
  const { spacing, fontSize } = DESIGN_TOKENS;

  return StyleSheet.create({
    stackHeader: createStackScreenHeaderStyle(width, height),
    screenContent: {
      flex: 1,
      paddingBottom: spacing.xl,
    },
    footnote: {
      marginTop: 0,
      marginBottom: spacing.md,
      paddingHorizontal: m.padding.horizontal,
    },
    listWrap: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxl,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: spacing.xxl,
      gap: spacing.sm,
    },
    emptyTitle: {
      fontSize: fontSize.lg,
      color: COLORS.text.primary,
      fontFamily: "Lato_700Bold",
    },
    emptyDesc: {
      fontSize: fontSize.sm,
      color: COLORS.text.secondary,
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: spacing.lg,
    },
  });
}
