import { StyleSheet } from "react-native";
import { createResponsiveMetrics } from "../../shared/responsive";
import { COLORS, DESIGN_TOKENS } from "../../constants/colors";

export function createRecordStyles(width: number, height: number) {
  const m = createResponsiveMetrics(width, height);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background.primary,
    },
    keyboardContainer: {
      flex: 1,
    },
    body: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingBottom: DESIGN_TOKENS.spacing.xxxl * 3,
    },
    /** 供 AppScreenShell / StackScreenHeader 外层：内边距与底部分割线 */
    stackHeader: {
      paddingHorizontal: m.padding.horizontal,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.gray[50],
    },
    content: {
      padding: m.padding.horizontal,
    },
    audioSection: {
      marginTop: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: COLORS.gray[100],
    },
    submitContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: m.padding.horizontal,
      paddingTop: DESIGN_TOKENS.spacing.xl,
      paddingBottom: DESIGN_TOKENS.spacing.xl,
      backgroundColor: COLORS.background.primary,
      ...DESIGN_TOKENS.shadow.xl,
    },
    submitButton: {
      width: "100%",
      paddingVertical: DESIGN_TOKENS.spacing.md,
      backgroundColor: COLORS.submit,
      borderRadius: DESIGN_TOKENS.borderRadius.large,
      alignItems: "center",
      ...DESIGN_TOKENS.shadow.xl,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitText: {
      fontSize: DESIGN_TOKENS.fontSize.lg,
      fontWeight: "bold",
      color: COLORS.text.inverse,
    },
  });
}
