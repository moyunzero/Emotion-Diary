/**
 * QUAL-02 — localDayKey / localMonthDayKey (local getters only)
 */

import {
  formatDate,
  localDayKey,
  localMonthDayKey,
} from '../../../../shared/formatting/localCalendar';

describe('localDayKey', () => {
  it('equals formatDate for the same local timestamps', () => {
    const fixtures = [
      new Date(2026, 0, 15, 9, 30).getTime(),
      new Date(2026, 5, 19, 23, 59).getTime(),
      new Date(2024, 1, 29, 12, 0).getTime(),
      new Date(2026, 11, 31, 0, 1).getTime(),
    ];

    for (const ms of fixtures) {
      expect(localDayKey(ms)).toBe(formatDate(ms));
    }
  });
});

describe('localMonthDayKey', () => {
  it('returns zero-padded MM-DD from local getters', () => {
    expect(localMonthDayKey(new Date(2026, 0, 5, 8).getTime())).toBe('01-05');
    expect(localMonthDayKey(new Date(2026, 5, 19, 23, 59).getTime())).toBe(
      '06-19',
    );
    expect(localMonthDayKey(new Date(2024, 1, 29, 12).getTime())).toBe(
      '02-29',
    );
    expect(localMonthDayKey(new Date(2026, 11, 31, 0, 1).getTime())).toBe(
      '12-31',
    );
  });
});
