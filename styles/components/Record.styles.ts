import { StyleSheet } from "react-native";
import { COLORS, DESIGN_TOKENS } from "../../constants/colors";
import { responsivePadding } from "../../utils/responsiveUtils";

export const styles = StyleSheet.create({
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
    // 给表单内容预留出按钮高度，避免被悬浮按钮遮挡
    paddingBottom: DESIGN_TOKENS.spacing.xxxl * 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsivePadding.horizontal(24),
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  backButton: {
    padding: DESIGN_TOKENS.spacing.sm,
    marginLeft: -DESIGN_TOKENS.spacing.sm,
  },
  headerTitle: {
    fontSize: DESIGN_TOKENS.fontSize.lg,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: responsivePadding.horizontal(24),
  },
  // 悬浮在 Tab 内容区底部，与 TabBar 之间保留固定下边距，视觉更舒适
  submitContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: responsivePadding.horizontal(24),
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
