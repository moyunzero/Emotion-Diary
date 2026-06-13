import { MoodLevel, Status, type MoodEntry } from '../../../../types';
import {
  filterDashboardEntries,
  getDashboardEntryItemType,
} from '../../../../shared/entries/dashboardFilter';

function makeEntry(
  partial: Partial<MoodEntry> & { id: string },
): MoodEntry {
  return {
    id: partial.id,
    timestamp: partial.timestamp ?? 1000,
    moodLevel: partial.moodLevel ?? MoodLevel.ANNOYED,
    content: partial.content ?? 'x',
    deadline: 'later',
    people: [],
    triggers: [],
    status: partial.status ?? Status.ACTIVE,
    deletedAt: partial.deletedAt,
  };
}

describe('filterDashboardEntries', () => {
  it('excludes soft-deleted entries', () => {
    const entries = [
      makeEntry({ id: 'a' }),
      makeEntry({ id: 'b', deletedAt: Date.now() }),
    ];
    expect(filterDashboardEntries(entries, 'active').map((e) => e.id)).toEqual([
      'a',
    ]);
  });

  it('all filter returns active then resolved then burned sorted by time', () => {
    const entries = [
      makeEntry({ id: 'burn-old', status: Status.BURNED, timestamp: 100 }),
      makeEntry({ id: 'active-new', timestamp: 300 }),
      makeEntry({ id: 'resolved', status: Status.RESOLVED, timestamp: 200 }),
    ];
    expect(filterDashboardEntries(entries, 'all').map((e) => e.id)).toEqual([
      'active-new',
      'resolved',
      'burn-old',
    ]);
  });

  it('active filter only returns active', () => {
    const entries = [
      makeEntry({ id: 'a' }),
      makeEntry({ id: 'r', status: Status.RESOLVED }),
    ];
    expect(filterDashboardEntries(entries, 'active').map((e) => e.id)).toEqual([
      'a',
    ]);
  });
});

describe('getDashboardEntryItemType', () => {
  it('maps status to item type', () => {
    expect(
      getDashboardEntryItemType(
        makeEntry({ id: 'a', status: Status.RESOLVED }),
      ),
    ).toBe('resolved');
    expect(
      getDashboardEntryItemType(
        makeEntry({ id: 'b', status: Status.BURNED }),
      ),
    ).toBe('burned');
    expect(getDashboardEntryItemType(makeEntry({ id: 'c' }))).toBe('active');
  });
});
