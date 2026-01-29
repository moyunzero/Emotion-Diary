import { StyleSheet } from 'react-native';
import { COLORS, DESIGN_TOKENS } from '../../constants/colors';
import { responsiveFontSize, responsivePadding } from '../../utils/responsiveUtils';

export const styles = StyleSheet.create({
  section: {
    marginBottom: DESIGN_TOKENS.spacing.xxxl,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.small(12),
    fontWeight: 'bold',
    color: COLORS.text.tertiary,
    marginBottom: DESIGN_TOKENS.spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
  },
  moodButton: {
    alignItems: 'center',
    opacity: 0.5,
  },
  moodButtonSelected: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  moodIconContainer: {
    marginBottom: DESIGN_TOKENS.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIconContainerSelected: {},
  moodLabel: {
    fontSize: DESIGN_TOKENS.fontSize.xs,
    fontWeight: 'bold',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: COLORS.text.primary,
    fontWeight: '800',
  },
  contentInput: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.background.secondary,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    padding: DESIGN_TOKENS.spacing.lg,
    fontSize: DESIGN_TOKENS.fontSize.md,
    color: COLORS.text.primary,
    textAlignVertical: 'top',
  },
  deadlineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  deadlineButton: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    backgroundColor: COLORS.gray[100],
  },
  deadlineButtonSelected: {
    backgroundColor: COLORS.text.primary,
    ...DESIGN_TOKENS.shadow.lg,
    transform: [{ scale: 1.05 }],
  },
  deadlineText: {
    fontSize: responsiveFontSize.small(12),
    fontWeight: 'bold',
    color: COLORS.text.secondary,
  },
  deadlineTextSelected: {
    color: COLORS.text.inverse,
  },
  customDeadlineInput: {
    width: '100%',
    backgroundColor: COLORS.background.secondary,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    padding: DESIGN_TOKENS.spacing.md,
    fontSize: responsiveFontSize.body(14),
    color: COLORS.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.xxl,
  },
  moodTipContainer: {
    backgroundColor: COLORS.background.primary,
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
    fontSize: responsiveFontSize.cardTitle(20),
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.md,
    textAlign: 'center',
  },
  moodTipDescription: {
    fontSize: responsiveFontSize.body(14),
    color: COLORS.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  moodTipCloseButton: {
    backgroundColor: COLORS.submit,
    paddingHorizontal: DESIGN_TOKENS.spacing.xxl,
    paddingVertical: 10,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
  },
  moodTipCloseText: {
    color: COLORS.text.inverse,
    fontSize: responsiveFontSize.body(14),
    fontWeight: '600',
  },
});
