/**
 * Wave 0 RED — shared/entries/dayGroup (ECHO-04 / D-37, D-43, D-44)
 * Filter-then-group; first-seen dayKey order; no empty day buckets;
 * today / yesterday / weekday+month-day headers (not N-days-ago).
 * GREEN in Plan 03. Runtime require so missing module fails the test (not TS2307).
 * Fixtures use local Date(y, mIndex, d, …) — do not mutate process.env.TZ
 */

import { filterDashboardEntries } from '../../../../shared/entries/dashboardFilter';
import { localDayKey } from '../../../../shared/formatting/localCalendar';
import type { MoodEntry } from '../../../../types';
import { Status } from '../../../../types';

type DayHeaderItem = { type: 'dayHeader'; dayKey: string; label: string };
type DayEntryItem = { type: 'entry'; entry: MoodEntry };
type DashboardDayItem = DayHeaderItem | DayEntryItem;

type DayGroupModule = {
  groupDashboardEntriesByDay: (
    entries: MoodEntry[],
  ) => { dayKey: string; entries: MoodEntry[] }[];
  formatDashboardDayHeader: (
    dayKey: string,
    now?: Date,
    locale?: 'zh-Hans' | 'en-US',
  ) => string;
  buildDashboardDaySections: (
    entries: MoodEntry[],
    now?: Date,
    locale?: 'zh-Hans' | 'en-US',
  ) => DashboardDayItem[];
};

function loadDayGroup(): DayGroupModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../../../shared/entries/dayGroup') as DayGroupModule;
}

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

describe('dayGroup (ECHO-04 / D-43 D-44)', () => {
  it('returns empty array for empty input (no empty day headers)', () => {
    const { groupDashboardEntriesByDay, buildDashboardDaySections } =
      loadDayGroup();
    expect(groupDashboardEntriesByDay([])).toEqual([]);
    expect(buildDashboardDaySections([])).toEqual([]);
  });

  it('preserves filter order and first-seen dayKey order; never emits empty days', () => {
    const { groupDashboardEntriesByDay } = loadDayGroup();
    const now = new Date(2024, 7, 10, 18, 0, 0, 0);
    const todayA = base({
      id: 'today-a',
      timestamp: new Date(2024, 7, 10, 15, 0, 0, 0).getTime(),
    });
    const todayB = base({
      id: 'today-b',
      timestamp: new Date(2024, 7, 10, 9, 0, 0, 0).getTime(),
    });
    const yesterday = base({
      id: 'yest',
      timestamp: new Date(2024, 7, 9, 12, 0, 0, 0).getTime(),
    });
    const older = base({
      id: 'older',
      timestamp: new Date(2024, 7, 7, 12, 0, 0, 0).getTime(),
    });
    // Soft-deleted must be stripped by filter before group (D-43)
    const softDeleted = base({
      id: 'gone',
      timestamp: new Date(2024, 7, 8, 12, 0, 0, 0).getTime(),
      deletedAt: now.getTime(),
    });

    const filtered = filterDashboardEntries(
      [todayA, todayB, yesterday, softDeleted, older],
      'active',
    );
    const groups = groupDashboardEntriesByDay(filtered);

    expect(groups.map((g) => g.dayKey)).toEqual([
      localDayKey(todayA.timestamp),
      localDayKey(yesterday.timestamp),
      localDayKey(older.timestamp),
    ]);
    expect(groups.every((g) => g.entries.length > 0)).toBe(true);
    expect(groups[0]?.entries.map((e) => e.id)).toEqual(['today-a', 'today-b']);
    expect(groups.some((g) => g.dayKey === localDayKey(softDeleted.timestamp))).toBe(
      false,
    );
  });

  it('flattens to dayHeader then entries with no empty header rows', () => {
    const { buildDashboardDaySections } = loadDayGroup();
    const now = new Date(2024, 7, 10, 18, 0, 0, 0);
    const a = base({
      id: 'a',
      timestamp: new Date(2024, 7, 10, 14, 0, 0, 0).getTime(),
    });
    const b = base({
      id: 'b',
      timestamp: new Date(2024, 7, 9, 10, 0, 0, 0).getTime(),
    });
    const items = buildDashboardDaySections([a, b], now, 'zh-Hans');
    const headers = items.filter((i) => i.type === 'dayHeader');
    const entries = items.filter((i) => i.type === 'entry');
    expect(headers).toHaveLength(2);
    expect(entries).toHaveLength(2);
    expect(items[0]?.type).toBe('dayHeader');
    expect(items[1]?.type).toBe('entry');
  });
});

describe('formatDashboardDayHeader (D-37)', () => {
  it('labels today and yesterday without N-days-ago relative strings', () => {
    const { formatDashboardDayHeader } = loadDayGroup();
    const now = new Date(2024, 7, 10, 18, 0, 0, 0);
    const todayKey = localDayKey(new Date(2024, 7, 10, 12, 0, 0, 0).getTime());
    const yesterdayKey = localDayKey(
      new Date(2024, 7, 9, 12, 0, 0, 0).getTime(),
    );
    const olderKey = localDayKey(new Date(2024, 7, 7, 12, 0, 0, 0).getTime());

    const todayZh = formatDashboardDayHeader(todayKey, now, 'zh-Hans');
    const yesterdayZh = formatDashboardDayHeader(yesterdayKey, now, 'zh-Hans');
    const olderZh = formatDashboardDayHeader(olderKey, now, 'zh-Hans');

    expect(todayZh).toMatch(/今天|Today/i);
    expect(yesterdayZh).toMatch(/昨天|Yesterday/i);
    // Other days: weekday + month-day — not "N天前" / "days ago"
    expect(olderZh).not.toMatch(/\d+\s*天前|days?\s*ago/i);
    expect(olderZh.length).toBeGreaterThan(0);
  });
});
