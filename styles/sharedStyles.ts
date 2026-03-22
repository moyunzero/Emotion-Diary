import { StyleSheet } from 'react-native';
import { createResponsiveMetrics } from '../shared/responsive';
import { COLORS, DESIGN_TOKENS } from '../constants/colors';

export function createSharedStyles(width: number, height: number) {
  const m = createResponsiveMetrics(width, height);
  return {
    formStyles: StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
      },
      keyboardContainer: {
        flex: 1,
      },
      scrollView: {
        flex: 1,
      },
      scrollViewContent: {
        flexGrow: 1,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: m.padding.horizontal,
        paddingVertical: DESIGN_TOKENS.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[50],
      },
      backButton: {
        padding: DESIGN_TOKENS.spacing.sm,
        marginLeft: -DESIGN_TOKENS.spacing.sm,
      },
      headerTitle: {
        fontSize: m.fontSize.cardTitle,
        fontWeight: 'bold',
        color: COLORS.text.primary,
      },
      placeholder: {
        width: 32,
      },
      content: {
        padding: m.padding.horizontal,
      },
      submitContainer: {
        paddingHorizontal: m.padding.horizontal,
        paddingTop: DESIGN_TOKENS.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[50],
        backgroundColor: COLORS.background.primary,
      },
      submitButton: {
        width: '100%',
        paddingVertical: DESIGN_TOKENS.spacing.lg,
        backgroundColor: COLORS.submit,
        borderRadius: DESIGN_TOKENS.borderRadius.large,
        alignItems: 'center',
        ...DESIGN_TOKENS.shadow.xl,
      },
      submitButtonDisabled: {
        opacity: 0.5,
      },
      submitText: {
        fontSize: m.fontSize.cardTitle,
        fontWeight: 'bold',
        color: COLORS.text.inverse,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background.primary,
      },
    }),
    cardStyles: StyleSheet.create({
      card: {
        backgroundColor: COLORS.background.primary,
        borderRadius: DESIGN_TOKENS.borderRadius.large,
        padding: DESIGN_TOKENS.spacing.lg,
        ...DESIGN_TOKENS.shadow.md,
      },
      cardTitle: {
        fontSize: m.fontSize.cardTitle,
        fontWeight: 'bold',
        color: COLORS.text.primary,
      },
      cardSubtitle: {
        fontSize: m.fontSize.small,
        color: COLORS.text.secondary,
      },
    }),
  };
}
