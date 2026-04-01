/**
 * 个人资料页样式
 * 使用设计 token 保持与全局一致
 */

import { StyleSheet } from "react-native";
import { createResponsiveMetrics } from "../../shared/responsive";
import { COLORS, DESIGN_TOKENS } from "../../constants/colors";
import {
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from "../../constants/spacing";

export function createProfileStyles(width: number, height: number) {
  const m = createResponsiveMetrics(width, height);
  const { spacing, borderRadius, fontSize, shadow } = DESIGN_TOKENS;

  const profileContentPadding = {
    paddingHorizontal: m.padding.horizontal,
    paddingBottom: SPACING.xl,
  };

  const profileStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background.page,
    },
    bgCircle: {
      position: "absolute",
      top: -width * 0.5,
      left: -width * 0.2,
      width: width * 1.4,
      height: width * 1.4,
      borderRadius: width * 0.7,
      backgroundColor: COLORS.background.page,
      opacity: 0.6,
    },
    /** Phase 15：栈顶栏外边距（布局由 StackScreenHeader 负责） */
    stackHeader: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    profileSection: {
      marginTop: SPACING.xl,
      marginBottom: SPACING.xxl,
      flexDirection: "row",
      alignItems: "center",
    },
    avatarWrapper: {
      position: "relative",
    },
    avatar: {},
    editBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: COLORS.error,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: COLORS.background.primary,
    },
    userInfo: {
      marginLeft: SPACING.xl,
      flex: 1,
    },
    userName: {
      fontSize: fontSize.xxl,
      fontWeight: FONT_WEIGHT.bold,
      color: COLORS.text.primary,
      marginBottom: spacing.xs,
    },
    userHandle: {
      fontSize: fontSize.base,
      color: COLORS.text.secondary,
      marginBottom: spacing.sm,
    },
    moodBadge: {
      backgroundColor: COLORS.background.tertiary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.medium,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: COLORS.primaryLight,
    },
    moodText: {
      fontSize: fontSize.sm,
      color: COLORS.error,
      fontWeight: FONT_WEIGHT.semibold,
    },
    loginTitle: {
      fontSize: fontSize.xxl,
      fontWeight: FONT_WEIGHT.bold,
      color: COLORS.text.primary,
      marginBottom: spacing.xs,
    },
    loginSubtitle: {
      fontSize: fontSize.base,
      color: COLORS.text.secondary,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: SPACING.xxl,
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: COLORS.background.primary,
      borderRadius: BORDER_RADIUS.xl,
      padding: spacing.lg,
      alignItems: "center",
      ...shadow.md,
    },
    statValue: {
      fontSize: fontSize.xl,
      fontWeight: FONT_WEIGHT.bold,
      color: COLORS.text.primary,
      marginBottom: spacing.xs,
    },
    statValueAccent: {
      color: COLORS.error,
    },
    statLabel: {
      fontSize: fontSize.sm,
      color: COLORS.text.tertiary,
    },
    menuContainer: {
      marginBottom: SPACING.xl,
    },
    menuHeader: {
      fontSize: fontSize.base,
      fontWeight: FONT_WEIGHT.semibold,
      color: COLORS.text.secondary,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    menuGroup: {
      backgroundColor: COLORS.background.primary,
      borderRadius: borderRadius.xl,
      overflow: "hidden",
      marginBottom: SPACING.xxl,
      ...shadow.md,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.lg,
    },
    menuIcon: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.medium,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.lg,
    },
    menuTextContainer: {
      flex: 1,
    },
    menuText: {
      fontSize: FONT_SIZE.md,
      color: COLORS.gray[700],
      fontWeight: FONT_WEIGHT.medium,
    },
    menuTextDanger: {
      color: COLORS.error,
    },
    menuSubtext: {
      fontSize: fontSize.sm,
      color: COLORS.text.tertiary,
      marginTop: 2,
    },
    menuItemDisabled: {
      opacity: 0.5,
    },
    menuDivider: {
      height: 1,
      backgroundColor: COLORS.gray[100],
      marginLeft: 68,
    },
    syncStatusContainer: {
      backgroundColor: COLORS.gray[50],
      borderRadius: borderRadius.medium,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    syncStatusRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    syncStatusLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    syncStatusText: {
      fontSize: fontSize.sm,
      color: COLORS.text.secondary,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
    },
  });

  return { profileContentPadding, profileStyles };
}
