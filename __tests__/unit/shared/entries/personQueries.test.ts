/**
 * Wave 0 RED — shared/entries/personQueries
 * QUAL-01 soft-delete · D-02 statuses · A1 PROCESSING · D-03 exact · D-04 other
 */

import {
  aggregateForPerson,
  entriesForPerson,
} from '../../../../shared/entries/personQueries';
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

describe('entriesForPerson', () => {
  it('QUAL-01: soft-deleted entry with matching person is never returned', () => {
    const visible = base({
      id: 'alive',
      people: ['Mom'],
      timestamp: 200,
    });
    const softDeleted = base({
      id: 'bin',
      people: ['Mom'],
      timestamp: 300,
      deletedAt: 99,
    });
    expect(entriesForPerson([visible, softDeleted], 'Mom').map((e) => e.id)).toEqual([
      'alive',
    ]);
  });

  it('D-02: active, resolved, and burned with matching person are returned', () => {
    const active = base({ id: 'a', people: ['Mom'], status: Status.ACTIVE, timestamp: 10 });
    const resolved = base({
      id: 'r',
      people: ['Mom'],
      status: Status.RESOLVED,
      timestamp: 20,
    });
    const burned = base({
      id: 'b',
      people: ['Mom'],
      status: Status.BURNED,
      timestamp: 30,
    });
    const ids = entriesForPerson([active, resolved, burned], 'Mom').map((e) => e.id);
    expect(ids).toEqual(['b', 'r', 'a']);
  });

  it('A1: PROCESSING with matching person is never returned', () => {
    const processing = base({
      id: 'p',
      people: ['Mom'],
      status: Status.PROCESSING,
      timestamp: 50,
    });
    const active = base({ id: 'a', people: ['Mom'], status: Status.ACTIVE, timestamp: 40 });
    expect(entriesForPerson([processing, active], 'Mom').map((e) => e.id)).toEqual([
      'a',
    ]);
  });

  it('D-03: exact people.includes only — trim/case variants do not match', () => {
    const exact = base({ id: 'exact', people: ['Mom'], timestamp: 1 });
    const trailing = base({ id: 'space', people: ['Mom '], timestamp: 2 });
    const lower = base({ id: 'case', people: ['mom'], timestamp: 3 });
    expect(entriesForPerson([exact, trailing, lower], 'Mom').map((e) => e.id)).toEqual([
      'exact',
    ]);
  });

  it('D-04: person key "other" matches like any other tag', () => {
    const other = base({ id: 'o', people: ['other'], timestamp: 5 });
    const mom = base({ id: 'm', people: ['Mom'], timestamp: 6 });
    expect(entriesForPerson([other, mom], 'other').map((e) => e.id)).toEqual(['o']);
  });
});

describe('aggregateForPerson', () => {
  it('empty list → entryCount 0, rate 0, growthStage seed, latest null', () => {
    expect(aggregateForPerson([], 'Mom')).toEqual({
      person: 'Mom',
      entryCount: 0,
      latestTimestamp: null,
      resolvedCount: 0,
      resolveRate: 0,
      growthStage: 'seed',
    });
  });

  it('mixed statuses → counts, newest-first latestTimestamp, resolveRate, growthStage', () => {
    const entries = [
      base({ id: 'a', people: ['Mom'], status: Status.ACTIVE, timestamp: 10 }),
      base({ id: 'r1', people: ['Mom'], status: Status.RESOLVED, timestamp: 30 }),
      base({ id: 'b', people: ['Mom'], status: Status.BURNED, timestamp: 20 }),
      base({ id: 'r2', people: ['Mom'], status: Status.RESOLVED, timestamp: 40 }),
      base({
        id: 'gone',
        people: ['Mom'],
        status: Status.RESOLVED,
        timestamp: 50,
        deletedAt: 1,
      }),
      base({
        id: 'proc',
        people: ['Mom'],
        status: Status.PROCESSING,
        timestamp: 60,
      }),
    ];
    const agg = aggregateForPerson(entries, 'Mom');
    expect(agg.entryCount).toBe(4);
    expect(agg.resolvedCount).toBe(2);
    expect(agg.resolveRate).toBe(0.5);
    expect(agg.latestTimestamp).toBe(40);
    expect(agg.growthStage).toBe('seedling');
    expect(agg.person).toBe('Mom');
  });
});
