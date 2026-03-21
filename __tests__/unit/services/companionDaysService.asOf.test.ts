import { Status } from '../../../types';
import {
  calculateDaysAsOf,
  getEffectiveFirstEntryDateForCompanion,
} from '../../../services/companionDaysService';

const entry = (ts: number) =>
  ({
    id: String(ts),
    timestamp: ts,
    moodLevel: 1,
    content: '',
    deadline: 'today',
    people: [],
    triggers: [],
    status: Status.ACTIVE,
  }) as const;

describe('companionDaysService calculateDaysAsOf', () => {
  it('returns 0 when firstEntryDate is missing', () => {
    expect(calculateDaysAsOf(undefined, Date.now())).toBe(0);
    expect(calculateDaysAsOf(null, Date.now())).toBe(0);
  });

  it('returns at least 1 when asOf is on the same calendar day as first entry', () => {
    const noon = new Date(2025, 2, 15, 12, 0, 0, 0).getTime();
    const endOfDay = new Date(2025, 2, 15, 23, 59, 59, 999).getTime();
    expect(calculateDaysAsOf(noon, endOfDay)).toBeGreaterThanOrEqual(1);
  });

  it('counts full days between first entry and asOf', () => {
    const day0 = new Date(2025, 0, 1, 10, 0, 0, 0).getTime();
    const day3 = new Date(2025, 0, 4, 10, 0, 0, 0).getTime();
    expect(calculateDaysAsOf(day0, day3)).toBe(3);
  });
});

describe('getEffectiveFirstEntryDateForCompanion', () => {
  it('uses user firstEntryDate when set', () => {
    const t = new Date(2025, 1, 1).getTime();
    expect(
      getEffectiveFirstEntryDateForCompanion(t, [entry(new Date(2025, 5, 1).getTime())]),
    ).toBe(t);
  });

  it('falls back to oldest entry when user date missing', () => {
    const a = new Date(2025, 3, 1).getTime();
    const b = new Date(2025, 1, 1).getTime();
    expect(getEffectiveFirstEntryDateForCompanion(undefined, [entry(a), entry(b)])).toBe(
      b,
    );
  });

  it('returns null when no user date and no entries', () => {
    expect(getEffectiveFirstEntryDateForCompanion(undefined, [])).toBeNull();
  });
});
