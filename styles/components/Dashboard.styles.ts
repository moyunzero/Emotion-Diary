import { StyleSheet } from 'react-native';
import { type ColorPalette, DESIGN_TOKENS } from '../../constants/colors';
import { createResponsiveMetrics } from '../../shared/responsive';

export function createDashboardStyles(
  width: number,
  height: number,
  colors: ColorPalette,
) {
  const m = createResponsiveMetrics(width, height);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.page,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: m.padding.horizontal,
      paddingTop: DESIGN_TOKENS.spacing.sm,
      paddingBottom: DESIGN_TOKENS.spacing.xxl,
    },
    title: {
      fontSize: m.fontSize.title,
      fontWeight: '700',
      lineHeight: m.fontSize.title * 1.2,
      letterSpacing: -0.5,
      color: colors.text.primary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    subtitle: {
      fontSize: m.fontSize.small,
      fontWeight: '400',
      lineHeight: m.fontSize.small * 1.2,
      letterSpacing: 0,
      color: colors.text.secondary,
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: DESIGN_TOKENS.borderRadius.full,
      overflow: 'hidden',
      backgroundColor: colors.background.primary,
      ...DESIGN_TOKENS.shadow.md,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    avatarPlaceholder: {
      backgroundColor: colors.primaryDark,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarPlaceholderText: {
      color: colors.text.inverse,
      fontSize: DESIGN_TOKENS.fontSize.md,
      fontWeight: 'bold',
    },
    weatherSection: {
      marginTop: DESIGN_TOKENS.spacing.xl,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    emptyCtaWrap: {
      alignSelf: 'stretch',
      width: '100%',
    },
    listHeader: {
      alignSelf: 'stretch',
      paddingHorizontal: m.padding.horizontal,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      minHeight: 44,
      backgroundColor: 'transparent',
      zIndex: 20,
    },
    segmentControl: {
      alignSelf: 'stretch',
      width: '100%',
    },

    flashListContent: {
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingBottom: DESIGN_TOKENS.spacing.xxl,
    },
    /** Day group header — Label/600 text.secondary; md top/bottom (UI-SPEC) */
    dayHeader: {
      paddingTop: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    },
    dayHeaderText: {
      fontSize: DESIGN_TOKENS.fontSize.caption,
      fontWeight: '600',
      lineHeight: Math.round(DESIGN_TOKENS.fontSize.caption * 1.43),
      letterSpacing: 0,
      color: colors.text.secondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 80,
      paddingHorizontal: m.padding.horizontal,
    },
    emptyIconContainer: {
      width: 96,
      height: 96,
      borderRadius: DESIGN_TOKENS.borderRadius.full,
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: DESIGN_TOKENS.spacing.xxl,
    },
    emptyTitle: {
      fontSize: m.fontSize.cardTitle,
      fontWeight: '700',
      lineHeight: m.fontSize.cardTitle * 1.2,
      letterSpacing: 0,
      color: colors.text.primary,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: m.fontSize.body,
      fontWeight: '400',
      lineHeight: m.fontSize.body * 1.2,
      letterSpacing: 0,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: DESIGN_TOKENS.spacing.xxxl,
    },
    emptyButton: {
      backgroundColor: colors.primaryDark,
      paddingHorizontal: DESIGN_TOKENS.spacing.xxl,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.borderRadius.medium,
      ...DESIGN_TOKENS.shadow.lg,
    },
    emptyButtonText: {
      fontSize: DESIGN_TOKENS.fontSize.md,
      fontWeight: '700',
      color: colors.text.inverse,
    },
  });
}
