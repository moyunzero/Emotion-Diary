/**
 * Wave 0 RED — empty week-day dashed-dot (FLOW-04 / D-23)
 * WeeklyMoodWeather no-entry day uses dashed-dot path; does not render
 * Sprout or flowerStatus.seed at that call site. Other Sprout empty-states
 * untouched (D-24). Source-scan; GREEN in later garden plan.
 */

import fs from 'fs';
import path from 'path';

const weeklySource = fs.readFileSync(
  path.join(
    __dirname,
    '../../../../components/Insights/WeeklyMoodWeather.tsx',
  ),
  'utf8',
);

describe('emptyWeekDay — dashed-dot (FLOW-04 / D-23)', () => {
  it('week-strip empty day branches to a dashed-dot path', () => {
    // Target: null moodLevel → dashed circle chrome (not Sprout icon path)
    const hasEmptyDashedBranch =
      /moodLevel\s*[=!]==\s*null[\s\S]{0,400}(dashed|emptyDay|EmptyDay|weekEmpty)/i.test(
        weeklySource,
      ) ||
      /!(?:moodLevel|dailyMoods)[\s\S]{0,400}(dashed|emptyDay|EmptyDay)/i.test(
        weeklySource,
      ) ||
      /emptyWeekDay|dashedDot|weekDayDashed|emptyDayDot/.test(weeklySource);
    expect(hasEmptyDashedBranch).toBe(true);
  });

  it('does not render Sprout or flowerStatus.seed at WeeklyMoodWeather call site', () => {
    expect(weeklySource).not.toMatch(/\bSprout\b/);
    expect(weeklySource).not.toMatch(/flowerStatus\.seed/);
    // Empty days must not fall through to getMoodFlowerStatus (seed copy)
    // or getMoodWeatherIcon (Sprout) without an empty branch first.
    const callsIconsUnconditionally =
      /getMoodWeatherIcon\(\s*moodLevel/.test(weeklySource) &&
      /getMoodFlowerStatus\(\s*moodLevel/.test(weeklySource) &&
      !/moodLevel\s*[=!]==\s*null/.test(weeklySource);
    expect(callsIconsUnconditionally).toBe(false);
  });
});
