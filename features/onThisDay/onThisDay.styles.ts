import { StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { createStackScreenHeaderStyle } from "@/styles/stackScreenHeader";

/** Phase 15 UI-SPEC B spacing — multiples of 4 only */
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

export function createOnThisDayStyles(_width: number, height: number) {
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
    orbit: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: S.sm,
      backgroundColor: "rgba(251,113,133,0.16)",
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.8)",
    },
    heroDate: {
      fontSize: 22,
      fontWeight: "700",
      lineHeight: 26,
      color: TEXT,
      textAlign: "center",
      marginBottom: S.xs,
    },
    heroSubtitle: {
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 20,
      color: TEXT_SECONDARY,
      textAlign: "center",
    },
    yearRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 44,
      marginBottom: S.sm,
    },
    yearSpineCol: {
      width: 18,
      alignItems: "center",
      marginRight: S.xs,
      alignSelf: "stretch",
      justifyContent: "center",
    },
    yearSpineLine: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: ACCENT,
      opacity: 0.55,
    },
    yearBead: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: ACCENT,
      borderWidth: 2,
      borderColor: CARD,
      zIndex: 1,
    },
    yearLabel: {
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
      color: TEXT_SECONDARY,
      letterSpacing: 0.4,
    },
    entryRow: {
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
  });
}
