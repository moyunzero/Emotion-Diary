import { buildReviewExportResponsiveLayout } from '../../../components/ReviewExport/reviewExportResponsiveLayout';
import type { ResponsiveStyleValues } from '../../../hooks/useResponsiveStyles';

function createResponsiveFixture(overrides: Partial<ResponsiveStyleValues>): ResponsiveStyleValues {
  return {
    padding: { horizontal: 20, vertical: 16, card: 20 },
    fontSize: { title: 24, cardTitle: 16, body: 14, small: 12 },
    spacing: { cardGap: 16, component: 16, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
    borderRadius: { card: 12, large: 16 },
    layout: { maxContentWidth: 390, gridColumns: 3, gridItemWidth: 100, gridGap: 8 },
    ...overrides,
  };
}

describe('ReviewExportScreen responsive layout mapping', () => {
  it('maps compact spacing and type scale on small screen', () => {
    const small = createResponsiveFixture({
      padding: { horizontal: 20, vertical: 16, card: 20 },
      fontSize: { title: 24, cardTitle: 16, body: 14, small: 12 },
      spacing: { cardGap: 16, component: 16, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
      borderRadius: { card: 12, large: 16 },
    });

    const layout = buildReviewExportResponsiveLayout(small);

    expect(layout.headerPaddingHorizontal).toBe(10);
    expect(layout.scrollHorizontalPadding).toBe(20);
    expect(layout.presetBottomPadding).toBe(10);
    expect(layout.chipTextFontSize).toBe(12);
    expect(layout.saveButtonTextFontSize).toBe(16);
    expect(layout.captureRadius).toBe(16);
  });

  it('maps wider spacing and larger type scale on tablet', () => {
    const tablet = createResponsiveFixture({
      padding: { horizontal: 40, vertical: 20, card: 25 },
      fontSize: { title: 27, cardTitle: 17, body: 14.5, small: 12.5 },
      spacing: { cardGap: 20, component: 20, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
      borderRadius: { card: 14, large: 20 },
      layout: { maxContentWidth: 700, gridColumns: 4, gridItemWidth: 140, gridGap: 10 },
    });

    const layout = buildReviewExportResponsiveLayout(tablet);

    expect(layout.headerPaddingHorizontal).toBe(20);
    expect(layout.scrollHorizontalPadding).toBe(40);
    expect(layout.presetBottomPadding).toBe(12);
    expect(layout.chipTextFontSize).toBe(12.5);
    expect(layout.saveButtonTextFontSize).toBe(16.5);
    expect(layout.captureRadius).toBe(20);
  });
});
