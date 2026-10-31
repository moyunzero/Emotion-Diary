import { StyleSheet } from 'react-native';
import { createResponsiveMetrics } from '../../shared/responsive';
import { type ColorPalette, DESIGN_TOKENS } from '../../constants/colors';

export function createMoodFormStyles(
  width: number,
  height: number,
  colors: ColorPalette,
  options?: { denseSections?: boolean },
) {
  const m = createResponsiveMetrics(width, height);
  const dense = options?.denseSections === true;
  return StyleSheet.create({
    section: {
      marginBottom: dense
        ? DESIGN_TOKENS.spacing.lg
        : DESIGN_TOKENS.spacing.xxxl,
    },
    sectionTitle: {
      fontSize: m.fontSize.small,
      fontWeight: 'bold',
      color: colors.text.tertiary,
      marginBottom: dense
        ? DESIGN_TOKENS.spacing.sm
        : DESIGN_TOKENS.spacing.lg,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    firstEntryHint: {
      fontSize: m.fontSize.body,
      color: colors.text.secondary,
      lineHeight: m.fontSize.body * 1.2,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    moodContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    },
    moodButton: {
      alignItems: 'center',
      opacity: 0.5,
      flex: 1,
      maxWidth: 72,
      minHeight: 44,
    },
    moodButtonSelected: {
      opacity: 1,
    },
    moodIconContainer: {
      marginBottom: DESIGN_TOKENS.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    /** D-24 Record selected: brand circle + white icon (list badges unchanged). */
    moodIconContainerSelected: {
      backgroundColor: colors.brand,
    },
    moodLabel: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      fontWeight: '600',
      color: colors.text.secondary,
      textAlign: 'center',
      maxWidth: 64,
    },
    moodLabelSelected: {
      color: colors.brand,
      fontWeight: '600',
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: DESIGN_TOKENS.spacing.sm,
    },
    contentInput: {
      flex: 1,
      minHeight: dense ? 140 : 120,
      height: dense ? undefined : 120,
      backgroundColor: colors.background.secondary,
      borderRadius: DESIGN_TOKENS.borderRadius.large,
      padding: DESIGN_TOKENS.spacing.lg,
      fontSize: DESIGN_TOKENS.fontSize.md,
      color: colors.text.primary,
      textAlignVertical: 'top',
    },
    micButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: DESIGN_TOKENS.spacing.sm,
    },
    deadlineContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    customDeadlineInput: {
      width: '100%',
      backgroundColor: colors.background.secondary,
      borderRadius: DESIGN_TOKENS.borderRadius.medium,
      padding: DESIGN_TOKENS.spacing.md,
      fontSize: m.fontSize.body,
      color: colors.text.primary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.xxl,
    },
    moodTipContainer: {
      backgroundColor: colors.background.primary,
      borderRadius: DESIGN_TOKENS.borderRadius.xl,
      padding: DESIGN_TOKENS.spacing.xxl,
      alignItems: 'center',
      maxWidth: 320,
      ...DESIGN_TOKENS.shadow.xl,
    },
    moodTipIconContainer: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    moodTipTitle: {
      fontSize: m.fontSize.cardTitle,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: DESIGN_TOKENS.spacing.md,
      textAlign: 'center',
    },
    moodTipDescription: {
      fontSize: m.fontSize.body,
      color: colors.text.secondary,
      lineHeight: m.fontSize.body * 1.2,
      textAlign: 'center',
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    moodTipCloseButton: {
      backgroundColor: colors.primaryDark,
      paddingHorizontal: DESIGN_TOKENS.spacing.xxl,
      paddingVertical: 10,
      borderRadius: DESIGN_TOKENS.borderRadius.medium,
    },
    moodTipCloseText: {
      color: colors.text.inverse,
      fontSize: m.fontSize.body,
      fontWeight: '600',
    },
    advancedToggle: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    advancedToggleText: {
      fontSize: DESIGN_TOKENS.fontSize.base,
      color: colors.text.secondary,
      fontWeight: '600',
    },
  });
}
