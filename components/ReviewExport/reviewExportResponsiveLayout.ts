import type { ResponsiveStyleValues } from '../../hooks/useResponsiveStyles';

export type ReviewExportResponsiveLayout = {
  headerPaddingHorizontal: number;
  headerPaddingTop: number;
  headerPaddingBottom: number;
  headerTitleFontSize: number;
  presetHorizontalPadding: number;
  presetBottomPadding: number;
  chipHorizontalPadding: number;
  chipVerticalPadding: number;
  chipRadius: number;
  chipTextFontSize: number;
  scrollHorizontalPadding: number;
  scrollBottomPadding: number;
  captureRadius: number;
  footerHorizontalPadding: number;
  footerTopPadding: number;
  saveButtonVerticalPadding: number;
  saveButtonRadius: number;
  saveButtonMinHeight: number;
  saveButtonTextFontSize: number;
};

export const buildReviewExportResponsiveLayout = (
  responsive: ResponsiveStyleValues,
): ReviewExportResponsiveLayout => ({
  headerPaddingHorizontal: Math.max(8, Math.round(responsive.padding.horizontal * 0.5)),
  headerPaddingTop: Math.max(4, Math.round(responsive.padding.vertical * 0.25)),
  headerPaddingBottom: Math.max(8, Math.round(responsive.padding.vertical * 0.5)),
  headerTitleFontSize: responsive.fontSize.cardTitle + 2,
  presetHorizontalPadding: responsive.padding.horizontal,
  presetBottomPadding: Math.max(10, Math.round(responsive.spacing.component * 0.6)),
  chipHorizontalPadding: Math.max(12, Math.round(responsive.padding.card * 0.6)),
  chipVerticalPadding: Math.max(8, Math.round(responsive.padding.vertical * 0.5)),
  chipRadius: responsive.borderRadius.large,
  chipTextFontSize: responsive.fontSize.small,
  scrollHorizontalPadding: responsive.padding.horizontal,
  scrollBottomPadding: responsive.spacing.component + 8,
  captureRadius: responsive.borderRadius.large,
  footerHorizontalPadding: responsive.padding.horizontal,
  footerTopPadding: Math.max(8, Math.round(responsive.padding.vertical * 0.5)),
  saveButtonVerticalPadding: Math.max(14, Math.round(responsive.padding.vertical * 0.9)),
  saveButtonRadius: responsive.borderRadius.card + 2,
  saveButtonMinHeight: Math.max(48, responsive.padding.vertical * 3),
  saveButtonTextFontSize: responsive.fontSize.body + 2,
});
