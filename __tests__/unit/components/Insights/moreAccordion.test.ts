/**
 * Plan 08 — garden 「更多回看」 accordion (FLOW-04 / D-22 D-26)
 * Default-collapsed More holds deferred + review CTA + EmotionForecastSection.
 * First-screen triad stays above. Source-scan.
 */

import fs from 'fs';
import path from 'path';

const insightsSource = fs.readFileSync(
  path.join(__dirname, '../../../../components/Insights/index.tsx'),
  'utf8',
);
const deferredSource = fs.readFileSync(
  path.join(
    __dirname,
    '../../../../components/Insights/InsightsDeferredSections.tsx',
  ),
  'utf8',
);

describe('moreAccordion — garden 更多回看 (FLOW-04 / D-22)', () => {
  it('Insights host has More accordion keyed more.toRevisit, default collapsed', () => {
    expect(insightsSource).toMatch(/more\.toRevisit/);
    expect(insightsSource).toMatch(
      /useState\(\s*false\s*\)|moreOpen|isMoreExpanded|moreExpanded/,
    );
    expect(insightsSource).toMatch(/testID=["']insights-more-accordion["']/);
  });

  it('first-screen triad order stays 本周 → 关系 → 照料 above More', () => {
    expect(insightsSource).toMatch(
      /WeeklyMoodWeather[\s\S]*RelationshipGarden[\s\S]*CareCountLine/,
    );
    const careIdx = insightsSource.indexOf('<CareCountLine');
    const moreIdx = insightsSource.indexOf('insights-more-accordion');
    expect(careIdx).toBeGreaterThan(-1);
    expect(moreIdx).toBeGreaterThan(careIdx);
  });

  it('does not keep review CTA or HealingProgress on the first-screen path', () => {
    // Review CTA + HealingProgress live under More / deferred, not above triad
    const headerToWeather = insightsSource.slice(
      insightsSource.indexOf('<GardenHeader'),
      insightsSource.indexOf('<WeeklyMoodWeather'),
    );
    expect(headerToWeather).not.toMatch(/reviewCta|HealingProgress/);
    expect(insightsSource).not.toMatch(
      /<CareCountLine[\s\S]{0,200}<HealingProgress/,
    );
  });

  it('pending count sits after CareCountLine and before the More accordion', () => {
    const careIdx = insightsSource.indexOf('<CareCountLine');
    const pendingIdx = insightsSource.indexOf('insights-pending-count');
    const moreIdx = insightsSource.indexOf('insights-more-accordion');
    expect(pendingIdx).toBeGreaterThan(careIdx);
    expect(pendingIdx).toBeLessThan(moreIdx);
    expect(insightsSource.slice(careIdx, moreIdx)).not.toMatch(/HealingProgress/);
  });
});

describe('moreAccordion — deferred + forecast under More (D-22 / D-26)', () => {
  it('InsightsDeferredSections mounts HealingProgress, review CTA, EmotionForecastSection', () => {
    expect(deferredSource).toMatch(/HealingProgress/);
    expect(deferredSource).toMatch(/reviewCta/);
    expect(deferredSource).toMatch(/EmotionForecastSection/);
  });

  it('lazy-mounts deferred children only when More is expanded', () => {
    expect(deferredSource).toMatch(/expanded/);
    expect(deferredSource).toMatch(/InteractionManager/);
    // Collapsed must not show a blocking spinner on the garden first screen
    expect(deferredSource).toMatch(
      /if\s*\(\s*!expanded\s*\)[\s\S]{0,80}return\s+null/,
    );
  });
});
