import { __priorYearTimestampsForTest } from '@/services/maestroOnThisDaySeed';

describe('priorYearTimestamps', () => {
  it('keeps non-leap dates at y-1 / y-2 with fixed hours', () => {
    const now = new Date(2026, 7, 11, 15, 0, 0, 0); // Aug 11
    const { y1, y2 } = __priorYearTimestampsForTest(now);
    const d1 = new Date(y1);
    const d2 = new Date(y2);
    expect(d1.getFullYear()).toBe(2025);
    expect(d1.getMonth()).toBe(7);
    expect(d1.getDate()).toBe(11);
    expect(d1.getHours()).toBe(10);
    expect(d2.getFullYear()).toBe(2024);
    expect(d2.getMonth()).toBe(7);
    expect(d2.getDate()).toBe(11);
    expect(d2.getHours()).toBe(11);
  });

  it('keeps Feb 29 on prior leap years (not rolled to Mar 1)', () => {
    // Construct a true Feb 29 via a leap year "today"
    const leapDay = new Date(2024, 1, 29, 12, 0, 0, 0);
    expect(leapDay.getMonth()).toBe(1);
    expect(leapDay.getDate()).toBe(29);

    const { y1, y2 } = __priorYearTimestampsForTest(leapDay);
    const d1 = new Date(y1);
    const d2 = new Date(y2);
    expect(d1.getMonth()).toBe(1);
    expect(d1.getDate()).toBe(29);
    expect(d1.getFullYear()).toBe(2020);
    expect(d1.getHours()).toBe(10);
    expect(d2.getMonth()).toBe(1);
    expect(d2.getDate()).toBe(29);
    expect(d2.getFullYear()).toBe(2016);
    expect(d2.getHours()).toBe(11);
  });

  it('from a non-leap calendar year context still maps leap day via Date(year,1,29) when year is leap', () => {
    const leapDay = new Date(2028, 1, 29, 8, 0, 0, 0);
    const { y1, y2 } = __priorYearTimestampsForTest(leapDay);
    expect(new Date(y1).getFullYear()).toBe(2024);
    expect(new Date(y2).getFullYear()).toBe(2020);
    expect(new Date(y1).getDate()).toBe(29);
    expect(new Date(y2).getDate()).toBe(29);
  });
});
