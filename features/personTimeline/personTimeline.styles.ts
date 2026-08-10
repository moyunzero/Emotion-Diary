import { StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { createStackScreenHeaderStyle } from "@/styles/stackScreenHeader";

/** Phase 14 UI-SPEC B spacing — multiples of 4 only */
const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

const PAGE_BG = COLORS.background.gradientStart;
const PAGE_BG_END = COLORS.background.gradientEnd;
const ACCENT = COLORS.primaryDark;
const TEXT = COLORS.text.primary;
const TEXT_SECONDARY = COLORS.text.secondary;
const CARD = COLORS.background.primary;

export function createPersonTimelineStyles(_width: number, height: number) {
  return StyleSheet.create({
    stackHeader: createStackScreenHeaderStyle(_width, height),
    screenRoot: {
      flex: 1,
      backgroundColor: PAGE_BG,
    },
    screenContent: {
      flex: 1,
      backgroundColor: PAGE_BG,
    },
    listWrap: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: S.md,
      paddingBottom: S["2xl"],
    },
    hero: {
      alignItems: "center",
      paddingTop: S.sm,
      paddingBottom: S.lg,
      backgroundColor: PAGE_BG_END,
      marginHorizontal: -S.md,
      paddingHorizontal: S.md,
      marginBottom: S.lg,
    },
    pot: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: S.sm,
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.8)",
    },
    personName: {
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
      color: TEXT,
      textAlign: "center",
      marginBottom: S.sm,
    },
    ribbon: {
      paddingHorizontal: S.md,
      paddingVertical: S.xs,
      borderRadius: 999,
    },
    ribbonText: {
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
    },
    metricStrip: {
      flexDirection: "row",
      backgroundColor: CARD,
      borderRadius: 16,
      paddingVertical: S.md,
      paddingHorizontal: S.sm,
      marginBottom: S.lg,
      borderWidth: 1,
      borderColor: "rgba(253,164,175,0.2)",
    },
    metricCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 44,
    },
    metricDivider: {
      width: 1,
      backgroundColor: "#F3F4F6",
      marginVertical: S.xs,
    },
    metricValue: {
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 20,
      color: TEXT,
      textAlign: "center",
    },
    metricKey: {
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
      color: TEXT_SECONDARY,
      marginTop: 2,
      textAlign: "center",
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
      color: TEXT_SECONDARY,
      letterSpacing: 0.6,
      marginBottom: S.sm,
      paddingHorizontal: 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    spineCol: {
      width: 18,
      alignItems: "center",
      marginRight: S.xs,
    },
    spineLine: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: ACCENT,
      opacity: 0.55,
    },
    spineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: ACCENT,
      borderWidth: 2,
      borderColor: CARD,
      marginTop: 18,
      zIndex: 1,
    },
    rowCard: {
      flex: 1,
      minWidth: 0,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: S.md,
      paddingVertical: S.xl,
      gap: S.sm,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 20,
      color: TEXT,
      textAlign: "center",
    },
    emptyBody: {
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 20,
      color: TEXT_SECONDARY,
      textAlign: "center",
      maxWidth: 280,
    },
    emptyCta: {
      marginTop: S.sm,
      minHeight: 44,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: ACCENT,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyCtaText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
}
