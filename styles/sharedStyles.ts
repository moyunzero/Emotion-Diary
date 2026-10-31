import { StyleSheet } from 'react-native';
import { createResponsiveMetrics } from '../shared/responsive';
import { type ColorPalette, DESIGN_TOKENS } from '../constants/colors';

export function createSharedStyles(
  width: number,
  height: number,
  colors: ColorPalette,
) {
  const m = createResponsiveMetrics(width, height);
  return {
    formStyles: StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background.primary,
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
        borderBottomColor: colors.gray[50],
      },
      backButton: {
        padding: DESIGN_TOKENS.spacing.sm,
        marginLeft: -DESIGN_TOKENS.spacing.sm,
      },
      headerTitle: {
        fontSize: m.fontSize.cardTitle,
        fontWeight: 'bold',
        color: colors.text.primary,
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
        borderTopColor: colors.gray[50],
        backgroundColor: colors.background.primary,
      },
      submitButton: {
        width: '100%',
        paddingVertical: DESIGN_TOKENS.spacing.lg,
        backgroundColor: colors.primaryDark,
        borderRadius: DESIGN_TOKENS.borderRadius.large,
        alignItems: 'center',
      },
      submitButtonDisabled: {
        opacity: 0.5,
      },
      submitText: {
        fontSize: m.fontSize.cardTitle,
        fontWeight: 'bold',
        color: colors.text.inverse,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
      },
    }),
    cardStyles: StyleSheet.create({
      card: {
        backgroundColor: colors.background.primary,
        borderRadius: DESIGN_TOKENS.borderRadius.large,
        padding: DESIGN_TOKENS.spacing.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.hairline,
      },
      cardTitle: {
        fontSize: m.fontSize.cardTitle,
        fontWeight: 'bold',
        color: colors.text.primary,
      },
      cardSubtitle: {
        fontSize: m.fontSize.small,
        color: colors.text.secondary,
      },
    }),
  };
}
