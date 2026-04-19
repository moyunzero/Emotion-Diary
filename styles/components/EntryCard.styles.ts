import { StyleSheet } from 'react-native';
import { createResponsiveMetrics } from '../../shared/responsive';
import { COLORS, DESIGN_TOKENS } from '../../constants/colors';

export function createEntryCardStyles(width: number, height: number) {
  const m = createResponsiveMetrics(width, height);
  return StyleSheet.create({
    wrapper: {
      marginHorizontal: DESIGN_TOKENS.spacing.lg,
      marginVertical: 6,
    },
    container: {
      backgroundColor: COLORS.background.primary,
      borderRadius: DESIGN_TOKENS.borderRadius.xl,
      padding: DESIGN_TOKENS.spacing.lg,
      ...DESIGN_TOKENS.shadow.md,
    },
    resolvedContainer: {
      opacity: 0.5,
    },
    burnedContainer: {
      backgroundColor: COLORS.background.secondary,
      borderWidth: 1,
      borderColor: COLORS.border.light,
      borderStyle: 'dashed',
      shadowColor: COLORS.primary,
      shadowOpacity: 0.08,
      shadowRadius: DESIGN_TOKENS.spacing.sm,
    },
    ashIconBadge: {
      backgroundColor: COLORS.gray[200],
    },
    burnedTitle: {
      fontSize: DESIGN_TOKENS.fontSize.md,
      fontWeight: '700',
      color: COLORS.text.secondary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
      letterSpacing: 0.5,
    },
    burnedDate: {
      fontSize: m.fontSize.small,
      color: COLORS.text.tertiary,
      fontWeight: '500',
    },
    burnedContentContainer: {
      marginTop: DESIGN_TOKENS.spacing.md,
      paddingTop: DESIGN_TOKENS.spacing.md,
      borderTopWidth: 1,
      borderTopColor: COLORS.border.light,
    },
    burnedContentLabel: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: COLORS.text.tertiary,
      fontWeight: '600',
      marginBottom: 6,
    },
    burnedContent: {
      fontSize: DESIGN_TOKENS.fontSize.base,
      color: COLORS.text.secondary,
      lineHeight: 20,
      fontStyle: 'italic',
      opacity: 0.7,
    },
    burnedHint: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: COLORS.text.tertiary,
      marginTop: DESIGN_TOKENS.spacing.sm,
      fontStyle: 'italic',
    },
    burnedMetaContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: COLORS.border.light,
    },
    burnedMeta: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: COLORS.text.tertiary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    burnActionButton: {},
    burnActionIcon: {
      backgroundColor: '#FEF3F2',
    },
    burnActionText: {
      color: '#DC2626',
      fontWeight: '700',
    },
    deleteActionText: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: COLORS.text.tertiary,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
    },
    moodIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
      minWidth: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    peopleText: {
      fontSize: DESIGN_TOKENS.fontSize.base,
      fontWeight: '700',
      color: COLORS.text.primary,
      flex: 1,
      marginRight: DESIGN_TOKENS.spacing.sm,
      letterSpacing: -0.3,
    },
    dateText: {
      fontSize: m.fontSize.small,
      color: COLORS.text.tertiary,
      fontWeight: '500',
    },
    contentText: {
      fontSize: m.fontSize.body,
      color: COLORS.text.secondary,
      lineHeight: 22,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    deadlineTag: {
      backgroundColor: COLORS.gray[100],
      paddingHorizontal: 10,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: 10,
    },
    deadlineText: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: COLORS.text.secondary,
      fontWeight: '600',
    },
    triggerTag: {
      backgroundColor: '#FDF2F8',
      paddingHorizontal: 10,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: 10,
    },
    triggerText: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: '#F472B6',
      fontWeight: '600',
    },
    audioTag: {
      backgroundColor: '#EEF2FF',
      paddingHorizontal: 10,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    audioTagText: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: '#6C63FF',
      fontWeight: '600',
    },
    audioPlaySection: {
      marginTop: DESIGN_TOKENS.spacing.sm,
      paddingTop: DESIGN_TOKENS.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: COLORS.gray[100],
    },
    audioPlaySectionTitle: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      fontWeight: '600',
      color: COLORS.text.tertiary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    audioPlayItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.borderRadius.xs,
      marginBottom: 4,
    },
    audioPlayItemActive: {
      backgroundColor: '#F5F3FF',
    },
    audioPlayName: {
      flex: 1,
      marginLeft: DESIGN_TOKENS.spacing.xs,
      fontSize: 13,
      color: COLORS.text.secondary,
    },
    audioPlayNameActive: {
      color: '#6C63FF',
      fontWeight: '500',
    },
    audioPlayDuration: {
      fontSize: 11,
      color: '#6C63FF',
      marginLeft: DESIGN_TOKENS.spacing.xs,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: COLORS.gray[100],
    },
    actionButton: {
      alignItems: 'center',
      gap: 6,
    },
    actionIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: COLORS.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      fontWeight: '600',
      color: COLORS.text.secondary,
    },
  });
}
