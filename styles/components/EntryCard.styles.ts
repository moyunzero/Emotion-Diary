import { StyleSheet } from 'react-native';
import { createResponsiveMetrics } from '../../shared/responsive';
import { type ColorPalette, DESIGN_TOKENS } from '../../constants/colors';

export function createEntryCardStyles(
  width: number,
  height: number,
  colors: ColorPalette,
) {
  const m = createResponsiveMetrics(width, height);
  return StyleSheet.create({
    wrapper: {
      marginHorizontal: DESIGN_TOKENS.spacing.lg,
      marginVertical: DESIGN_TOKENS.spacing.sm, // 8 — 4px scale (UI-REVIEW Top1)
    },
    container: {
      backgroundColor: colors.background.primary,
      borderRadius: DESIGN_TOKENS.borderRadius.xl,
      padding: DESIGN_TOKENS.spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
      overflow: 'hidden',
      position: 'relative',
    },
    /** Left weather mood strip (ECHO-02 / D-04) — fill set inline from colors.weather.*.icon */
    weatherStrip: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    /** Reduce Motion playing highlight — static thicker strip (D-06) */
    weatherStripHighlight: {
      width: 5,
    },
    /** Rose ink under visible preview (D-05 / D-11) — width set inline from ink ratio */
    inkProgressLine: {
      height: 2,
      marginTop: DESIGN_TOKENS.spacing.xs,
      backgroundColor: colors.brand,
      borderRadius: 1,
      alignSelf: 'flex-start',
    },
    resolvedContainer: {
      opacity: 0.5,
    },
    burnedContainer: {
      backgroundColor: colors.background.secondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.light,
      borderStyle: 'dashed',
      opacity: 0.88,
      ...DESIGN_TOKENS.shadow.none,
    },
    ashIconBadge: {
      backgroundColor: colors.gray[200],
    },
    burnedTitle: {
      fontSize: DESIGN_TOKENS.fontSize.md,
      fontWeight: '700',
      color: colors.text.secondary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
      letterSpacing: 0.5,
    },
    burnedDate: {
      fontSize: m.fontSize.small,
      color: colors.text.tertiary,
      fontWeight: '500',
    },
    burnedContentContainer: {
      marginTop: DESIGN_TOKENS.spacing.md,
      paddingTop: DESIGN_TOKENS.spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    burnedContentLabel: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.text.tertiary,
      fontWeight: '600',
      marginBottom: 6,
    },
    burnedContent: {
      fontSize: DESIGN_TOKENS.fontSize.base,
      color: colors.text.secondary,
      lineHeight: 20,
      fontStyle: 'italic',
      opacity: 0.7,
    },
    burnedHint: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.text.tertiary,
      marginTop: DESIGN_TOKENS.spacing.sm,
      fontStyle: 'italic',
    },
    burnedMetaContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    burnedMeta: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.text.tertiary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    deleteActionText: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.text.tertiary,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: DESIGN_TOKENS.spacing.md, // 12 — 4px scale (UI-REVIEW Top1)
    },
    moodIconBadge: {
      width: 44,
      height: 44,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      backgroundColor: colors.surface2,
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
      marginBottom: DESIGN_TOKENS.spacing.sm, // 8 — 4px scale
    },
    peopleText: {
      fontSize: DESIGN_TOKENS.fontSize.base,
      fontWeight: '700',
      color: colors.text.primary,
      flex: 1,
      marginRight: DESIGN_TOKENS.spacing.sm,
      letterSpacing: -0.3,
    },
    dateText: {
      fontSize: m.fontSize.small,
      color: colors.text.secondary,
      fontWeight: '400', // Footnote/400 (UI-REVIEW Top3 / UI-SPEC)
    },
    /** Trailing ⋯ More control (ECHO-04 / D-40) — ≥44 hit */
    headerTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.xs,
    },
    moreButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -DESIGN_TOKENS.spacing.sm,
    },
    contentText: {
      fontSize: m.fontSize.body,
      color: colors.text.secondary,
      lineHeight: 22,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: DESIGN_TOKENS.spacing.sm, // 8 — 4px scale (UI-REVIEW Top1)
    },
    deadlineTag: {
      backgroundColor: colors.gray[100],
      paddingHorizontal: 10,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.borderRadius.sm,
    },
    deadlineText: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    triggerTag: {
      backgroundColor: colors.brandSoft,
      paddingHorizontal: 10,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.borderRadius.sm,
    },
    triggerText: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.brandPressed,
      fontWeight: '600',
    },
    audioTag: {
      backgroundColor: colors.audio.surface,
      paddingHorizontal: 10,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.borderRadius.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    audioTagText: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.audio.primary,
      fontWeight: '600',
    },
    audioPlaySection: {
      marginTop: DESIGN_TOKENS.spacing.sm,
      paddingTop: DESIGN_TOKENS.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.gray[100],
    },
    audioPlaySectionTitle: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      fontWeight: '600',
      color: colors.text.tertiary,
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
      backgroundColor: colors.audio.surface,
    },
    audioPlayName: {
      flex: 1,
      marginLeft: DESIGN_TOKENS.spacing.xs,
      fontSize: 13,
      color: colors.text.secondary,
    },
    audioPlayNameActive: {
      color: colors.audio.primary,
      fontWeight: '500',
    },
    audioPlayDuration: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.audio.primary,
      marginLeft: DESIGN_TOKENS.spacing.xs,
    },
    audioPlayRow: {
      marginBottom: 4,
    },
    audioSyncMeta: {
      paddingHorizontal: DESIGN_TOKENS.spacing.xs,
      paddingBottom: DESIGN_TOKENS.spacing.xs,
    },
    audioSyncPending: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.text.tertiary,
    },
    audioSyncFailed: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.error,
      fontWeight: '600',
    },
    echoStripSection: {
      marginTop: DESIGN_TOKENS.spacing.sm,
      gap: DESIGN_TOKENS.spacing.xs,
    },
    echoStripRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.xs,
    },
    echoStrip: {
      height: 36,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      borderCurve: 'continuous',
      backgroundColor: colors.brandSoft,
      justifyContent: 'center',
    },
    echoStripFlex: {
      flex: 1,
      minWidth: 0,
    },
    echoStripLabel: {
      fontSize: DESIGN_TOKENS.fontSize.base,
      fontWeight: '600',
      color: colors.brand,
    },
    echoSegmentDisclosure: {
      height: 36,
      minWidth: 44,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    echoSegmentDisclosureOpen: {
      borderColor: colors.brand,
      backgroundColor: colors.brandSoft,
    },
    echoSegmentDisclosureLabel: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    echoSegmentDisclosureLabelOpen: {
      color: colors.brand,
    },
    echoStripFootnote: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.text.tertiary,
      fontWeight: '400',
    },
    echoStripRetry: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      color: colors.text.tertiary,
      fontWeight: '400',
    },
    echoClipChipScroll: {
      flexGrow: 0,
    },
    echoClipChipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.xs,
      paddingVertical: 2,
    },
    smokeStrip: {
      height: 36,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      borderCurve: 'continuous',
      backgroundColor: colors.surface2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
      justifyContent: 'center',
      opacity: 0.9,
    },
    smokeStripLabel: {
      fontSize: DESIGN_TOKENS.fontSize.base,
      fontWeight: '600',
      color: colors.text.tertiary,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.gray[100],
    },
    actionButton: {
      alignItems: 'center',
      gap: 6,
    },
    actionIcon: {
      width: 42,
      height: 42,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      fontSize: DESIGN_TOKENS.fontSize.xs,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    /** Left-swipe underlay row (ECHO-04 / D-38) — ritual colors only */
    swipeActionsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    swipeActionResolve: {
      backgroundColor: colors.ritual.resolve,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 72,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    swipeActionBurn: {
      backgroundColor: colors.ritual.burn,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 72,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    swipeActionText: {
      fontSize: DESIGN_TOKENS.fontSize.footnote,
      fontWeight: '600',
      color: colors.text.inverse,
    },
  });
}
