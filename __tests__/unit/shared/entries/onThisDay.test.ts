/**
 * Wave 0 RED — shared/entries/onThisDay
 * QUAL-01/02 · D-01 leap-day · D-02/A1 statuses · optional person (D-03)
 * Fixtures use local Date(y, mIndex, d, …) — do not mutate process.env.TZ
 */

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'zh-Hans' }]),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { entriesOnThisDayPriorYears } from '../../../../shared/entries/onThisDay';
import type { MoodEntry } from '../../../../types';
import { Status } from '../../../../types';

const base = (overrides: Partial<MoodEntry> = {}): MoodEntry => ({
  id: 'e1',
  timestamp: 1,
  moodLevel: 2,
  content: '',
  deadline: 'later',
  people: [],
  triggers: [],
  status: Status.ACTIVE,
  ...overrides,
});

describe('entriesOnThisDayPriorYears', () => {
  it('QUAL-01: soft-deleted entry with matching local MM-DD is never returned', () => {
    const ts = new Date(2024, 5, 15, 12, 0, 0, 0).getTime();
    const soft = base({
      id: 'bin',
      timestamp: ts,
      people: ['Mom'],
      deletedAt: 99,
    });
    const alive = base({
      id: 'alive',
      timestamp: new Date(2023, 5, 15, 9, 0, 0, 0).getTime(),
      people: ['Mom'],
    });
    const anchor = new Date(2025, 5, 15, 10, 0, 0, 0).getTime();
    expect(
      entriesOnThisDayPriorYears([soft, alive], anchor).map((e) => e.id),
    ).toEqual(['alive']);
  });

  it('QUAL-02: prior-year local MM-DD matches newest-first; same/future year excluded', () => {
    const older = base({
      id: 'y2022',
      timestamp: new Date(2022, 3, 10, 8, 0, 0, 0).getTime(),
    });
    const newer = base({
      id: 'y2024',
      timestamp: new Date(2024, 3, 10, 14, 0, 0, 0).getTime(),
    });
    const sameYear = base({
      id: 'y2025',
      timestamp: new Date(2025, 3, 10, 11, 0, 0, 0).getTime(),
    });
    const future = base({
      id: 'y2026',
      timestamp: new Date(2026, 3, 10, 11, 0, 0, 0).getTime(),
    });
    const otherDay = base({
      id: 'other',
      timestamp: new Date(2024, 3, 11, 11, 0, 0, 0).getTime(),
    });
    const anchor = new Date(2025, 3, 10, 12, 0, 0, 0).getTime();
    expect(
      entriesOnThisDayPriorYears(
        [older, newer, sameYear, future, otherDay],
        anchor,
      ).map((e) => e.id),
    ).toEqual(['y2024', 'y2022']);
  });

  it('D-01: Feb 29 prior-year only matches when anchor is Feb 29', () => {
    const feb29_2024 = new Date(2024, 1, 29, 12, 0, 0, 0).getTime();
    const entries = [base({ id: 'leap', timestamp: feb29_2024, people: ['Mom'] })];
    const leapAnchor = new Date(2028, 1, 29, 12, 0, 0, 0).getTime();
    const feb28_2023 = new Date(2023, 1, 28, 12, 0, 0, 0).getTime();
    const mar1_2023 = new Date(2023, 2, 1, 12, 0, 0, 0).getTime();

    expect(
      entriesOnThisDayPriorYears(entries, leapAnchor).map((e) => e.id),
    ).toEqual(['leap']);
    expect(entriesOnThisDayPriorYears(entries, feb28_2023)).toEqual([]);
    expect(entriesOnThisDayPriorYears(entries, mar1_2023)).toEqual([]);
  });

  it('D-02 + A1: includes active/resolved/burned; excludes PROCESSING', () => {
    const md = (y: number) => new Date(y, 7, 1, 12, 0, 0, 0).getTime();
    const active = base({ id: 'a', timestamp: md(2022), status: Status.ACTIVE });
    const resolved = base({
      id: 'r',
      timestamp: md(2023),
      status: Status.RESOLVED,
    });
    const burned = base({ id: 'b', timestamp: md(2021), status: Status.BURNED });
    const processing = base({
      id: 'p',
      timestamp: md(2020),
      status: Status.PROCESSING,
    });
    const anchor = md(2024);
    expect(
      entriesOnThisDayPriorYears(
        [active, resolved, burned, processing],
        anchor,
      ).map((e) => e.id),
    ).toEqual(['r', 'a', 'b']);
  });

  it('optional { person } filter uses exact people.includes (D-03)', () => {
    const ts = new Date(2023, 0, 5, 12, 0, 0, 0).getTime();
    const mom = base({ id: 'mom', timestamp: ts, people: ['Mom'] });
    const momSpace = base({ id: 'space', timestamp: ts, people: ['Mom '] });
    const dad = base({ id: 'dad', timestamp: ts, people: ['Dad'] });
    const anchor = new Date(2025, 0, 5, 12, 0, 0, 0).getTime();
    expect(
      entriesOnThisDayPriorYears([mom, momSpace, dad], anchor, {
        person: 'Mom',
      }).map((e) => e.id),
    ).toEqual(['mom']);
  });
});
