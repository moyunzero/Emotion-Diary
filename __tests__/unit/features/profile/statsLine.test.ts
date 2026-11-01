/**
 * Wave 0 RED — Me stats line (FLOW-06 / D-28)
 * One gentle companion/moments line; digits path must not use
 * danger/error accent for counts. Source-scan; GREEN in later Me plan.
 */

import fs from 'fs';
import path from 'path';

const profileStatsSource = fs.readFileSync(
  path.join(
    __dirname,
    '../../../../features/profile/components/ProfileStatsSection.tsx',
  ),
  'utf8',
);
const profileStylesSource = fs.readFileSync(
  path.join(__dirname, '../../../../styles/components/Profile.styles.ts'),
  'utf8',
);

describe('statsLine — Me companion/moments (FLOW-06 / D-28)', () => {
  it('renders one gentle companion/moments stats line', () => {
    const hasOneLine =
      /stats\.companionMoments|companionMomentsLine|已陪伴|moments kept|days together/.test(
        profileStatsSource,
      ) ||
      /companionDays.*entries|entries.*companionDays/.test(profileStatsSource);
    expect(hasOneLine).toBe(true);
    // Drop dual ProfileStatCard mood-index chrome
    expect(profileStatsSource).not.toMatch(/ProfileStatCard/);
    expect(profileStatsSource).not.toMatch(/weatherScoreLabel/);
  });

  it('does not use danger/error accent on Me count digits', () => {
    expect(profileStatsSource).not.toMatch(/\baccent\b/);
    expect(profileStatsSource).not.toMatch(/COLORS\.error/);
    expect(profileStatsSource).not.toMatch(/COLORS\.danger/);
    // Me stats path must not wire accent→error via ProfileStatCard styles
    const meStatsUsesErrorAccent =
      /statValueAccent[\s\S]{0,200}COLORS\.(error|danger)/.test(
        profileStylesSource,
      ) && /ProfileStatCard|accent/.test(profileStatsSource);
    expect(meStatsUsesErrorAccent).toBe(false);
  });
});
