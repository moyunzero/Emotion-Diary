/**
 * Plan 27-02 — mood tip icon color (D-07 / D-08)
 * Source-scan: tip path uses colors.mood.icon; MoodForm does not read static iconColor.
 */

import fs from 'fs';
import path from 'path';

const moodFormSource = fs.readFileSync(
  path.join(__dirname, '../../../../components/MoodForm.tsx'),
  'utf8',
);

describe('tipIconColor — mood tip uses palette ramp (D-07 / D-08)', () => {
  it('MoodForm source contains colors.mood.icon', () => {
    expect(moodFormSource).toMatch(/colors\.mood\.icon/);
  });

  it('MoodForm source does not contain iconColor', () => {
    expect(moodFormSource).not.toMatch(/iconColor/);
  });
});

describe('tipIconColor — MOOD_CONFIG has no static icon color (D-07)', () => {
  const constantsSource = fs.readFileSync(
    path.join(process.cwd(), 'constants.ts'),
    'utf8',
  );

  it('constants.ts does not contain iconColor', () => {
    expect(constantsSource).not.toMatch(/iconColor/);
  });
});
