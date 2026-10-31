/**
 * Wave 0 RED — careWeekCount Monday-week window (FLOW-04 / D-19)
 * Counts entries whose timestamp falls in [startMs, endMs] from
 * getMondayWeekRangeContaining. Fixtures use local Date(y, mIndex, d, …).
 * GREEN in Plan 06. Runtime require so missing module fails the test (not TS2307).
 */

import { getMondayWeekRangeContaining } from '../../../../shared/time-range/periods';

type CareWeekCountModule = {
  careWeekCount: (
    entries: { timestamp: number }[],
    now?: Date,
  ) => number;
};

function loadCareWeekCount(): CareWeekCountModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../../../shared/entries/careWeekCount') as CareWeekCountModule;
}

describe('careWeekCount (FLOW-04 / D-19)', () => {
  it('counts only entries inside the Monday-week containing now', () => {
    const { careWeekCount } = loadCareWeekCount();
    // Wednesday 2024-08-07 local
    const now = new Date(2024, 7, 7, 12, 0, 0, 0);
    const { startMs, endMs } = getMondayWeekRangeContaining(now);

    const inWeekMon = new Date(2024, 7, 5, 9, 0, 0, 0).getTime(); // Mon
    const inWeekSun = new Date(2024, 7, 11, 18, 0, 0, 0).getTime(); // Sun
    const beforeWeek = new Date(2024, 7, 4, 23, 0, 0, 0).getTime(); // Sun prior
    const afterWeek = new Date(2024, 7, 12, 0, 30, 0, 0).getTime(); // Mon next

    expect(inWeekMon).toBeGreaterThanOrEqual(startMs);
    expect(inWeekMon).toBeLessThanOrEqual(endMs);
    expect(inWeekSun).toBeGreaterThanOrEqual(startMs);
    expect(inWeekSun).toBeLessThanOrEqual(endMs);
    expect(beforeWeek).toBeLessThan(startMs);
    expect(afterWeek).toBeGreaterThan(endMs);

    const n = careWeekCount(
      [
        { timestamp: inWeekMon },
        { timestamp: inWeekSun },
        { timestamp: beforeWeek },
        { timestamp: afterWeek },
      ],
      now,
    );
    expect(n).toBe(2);
  });

  it('returns 0 when no entries fall in the Monday week', () => {
    const { careWeekCount } = loadCareWeekCount();
    const now = new Date(2024, 7, 7, 12, 0, 0, 0);
    const outside = new Date(2024, 6, 1, 12, 0, 0, 0).getTime();
    expect(careWeekCount([{ timestamp: outside }], now)).toBe(0);
    expect(careWeekCount([], now)).toBe(0);
  });
});
