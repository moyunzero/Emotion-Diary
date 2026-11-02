import { MoodLevel, Status, type MoodEntry } from '../../../../types';
import {
  countPendingEntries,
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

  it('all filter returns mixed statuses sorted by timestamp desc (timeline)', () => {
    // Stacked-by-status would be active-old → resolved-new → burned-mid;
    // timeline must interleave by time: resolved-new → burned-mid → active-old.
    const entries = [
      makeEntry({ id: 'active-old', timestamp: 100 }),
      makeEntry({
        id: 'resolved-new',
        status: Status.RESOLVED,
        timestamp: 300,
      }),
      makeEntry({ id: 'burned-mid', status: Status.BURNED, timestamp: 200 }),
    ];
    expect(filterDashboardEntries(entries, 'all').map((e) => e.id)).toEqual([
      'resolved-new',
      'burned-mid',
      'active-old',
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

describe('countPendingEntries', () => {
  it('returns 0 for empty array', () => {
    expect(countPendingEntries([])).toBe(0);
  });

  it('counts only ACTIVE; excludes RESOLVED and BURNED', () => {
    const entries = [
      makeEntry({ id: 'a1' }),
      makeEntry({ id: 'a2' }),
      makeEntry({ id: 'r', status: Status.RESOLVED }),
      makeEntry({ id: 'b', status: Status.BURNED }),
    ];
    expect(countPendingEntries(entries)).toBe(2);
  });

  it('excludes soft-deleted ACTIVE entries', () => {
    const entries = [
      makeEntry({ id: 'alive' }),
      makeEntry({ id: 'gone', deletedAt: Date.now() }),
    ];
    expect(countPendingEntries(entries)).toBe(1);
  });

  it('matches filterDashboardEntries(active).length on mixed fixture', () => {
    const entries = [
      makeEntry({ id: 'a1', timestamp: 300 }),
      makeEntry({ id: 'a2', timestamp: 200 }),
      makeEntry({ id: 'r', status: Status.RESOLVED, timestamp: 250 }),
      makeEntry({ id: 'b', status: Status.BURNED, timestamp: 100 }),
      makeEntry({ id: 'soft', deletedAt: Date.now(), timestamp: 400 }),
    ];
    expect(countPendingEntries(entries)).toBe(
      filterDashboardEntries(entries, 'active').length,
    );
  });
});
