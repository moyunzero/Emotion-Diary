/**
 * shared/sync/pullConflictCount.ts — shared ids whose local revision is newer.
 */

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'zh-Hans' }]),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { countReplaceableSharedIds } from '../../../../shared/sync/pullConflictCount';
import {
  emptyRevisionMeta,
  shouldUpsertEntry,
} from '../../../../shared/sync/revisionMeta';

describe('countReplaceableSharedIds', () => {
  it('counts one shared id when local updatedAt is strictly greater (D-01)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 1_700_000_002_000 }],
      [{ id: 'shared', updatedat: 1_700_000_001_000 }],
      new Set(),
    );

    expect(typeof total).toBe('number');
    expect(total).toBe(1);
  });

  it('returns 0 for a local-only id (PULL-06)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'local-only', updatedAt: 1_700_000_002_000 }],
      [{ id: 'other', updatedat: 1_700_000_001_000 }],
      new Set(),
    );

    expect(total).toBe(0);
  });

  it('returns 0 for a cloud-only id (PULL-06)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'local-only', updatedAt: 1_700_000_002_000 }],
      [{ id: 'cloud-only', updatedat: 1_700_000_001_000 }],
      new Set(),
    );

    expect(total).toBe(0);
  });

  it('returns 0 when the normalized timestamps are equal (D-02)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 1_700_000_001_000 }],
      [{ id: 'shared', updatedat: 1_700_000_001_000 }],
      new Set(),
    );

    expect(total).toBe(0);
  });

  it('returns 0 when cloud updatedat is missing, null, or a string (D-03)', () => {
    const local = [{ id: 'shared', updatedAt: 1_700_000_002_000 }];
    const missing = countReplaceableSharedIds(
      local,
      [{ id: 'shared' }],
      new Set(),
    );
    const absent = countReplaceableSharedIds(
      local,
      [{ id: 'shared', updatedat: null }],
      new Set(),
    );
    const textual = countReplaceableSharedIds(
      local,
      [{ id: 'shared', updatedat: '1700000001000' }],
      new Set(),
    );

    expect(missing).toBe(0);
    expect(absent).toBe(0);
    expect(textual).toBe(0);
  });

  it('returns 0 when seconds and the equivalent milliseconds normalize equal (D-04)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 1_700_000_001_000 }],
      [{ id: 'shared', updatedat: 1_700_000_001 }],
      new Set(),
    );

    expect(total).toBe(0);
  });

  it('counts a soft-deleted row when local time is strictly newer (D-05)', () => {
    const localRows = [
      { id: 'shared', updatedAt: 1_700_000_002_000, deletedAt: 99 },
    ];
    const total = countReplaceableSharedIds(
      localRows,
      [{ id: 'shared', updatedat: 1_700_000_001_000 }],
      new Set(),
    );

    expect(total).toBe(1);
  });

  it('counts a burned row when local time is strictly newer (D-05)', () => {
    const localRows = [
      {
        id: 'shared',
        updatedAt: 1_700_000_002_000,
        status: 'burned',
        burnedAt: 50,
      },
    ];
    const total = countReplaceableSharedIds(
      localRows,
      [{ id: 'shared', updatedat: 1_700_000_001_000 }],
      new Set(),
    );

    expect(total).toBe(1);
  });

  it('returns one total for a soft-deleted row and a burned row (D-07)', () => {
    const localRows = [
      { id: 'soft', updatedAt: 1_700_000_002_000, deletedAt: 99 },
      { id: 'burned', updatedAt: 1_700_000_004_000, status: 'burned' },
    ];
    const total = countReplaceableSharedIds(
      localRows,
      [
        { id: 'soft', updatedat: 1_700_000_001_000 },
        { id: 'burned', updatedat: 1_700_000_003_000 },
      ],
      new Set(),
    );

    expect(total).toBe(2);
  });

  it('returns 0 when the shared id is in the tombstone set (D-06)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 1_700_000_002_000 }],
      [{ id: 'shared', updatedat: 1_700_000_001_000 }],
      new Set(['shared']),
    );

    expect(total).toBe(0);
  });

  it('does not drop a newer shared id when the tombstone set is empty (D-08)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 1_700_000_002_000 }],
      [{ id: 'shared', updatedat: 1_700_000_001_000 }],
      new Set(),
    );

    expect(total).toBe(1);
  });

  it('counts a duplicate cloud id once from the last updatedat (A1)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 1_700_000_005_000 }],
      [
        { id: 'shared', updatedat: 1_700_000_001_000 },
        { id: 'shared', updatedat: 1_700_000_002_000 },
      ],
      new Set(),
    );

    expect(total).toBe(1);
  });

  it('does not fall back to an earlier duplicate when the last updatedat is not a number (A1)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 1_700_000_002_000 }],
      [
        { id: 'shared', updatedat: 1_700_000_001_000 },
        { id: 'shared', updatedat: null },
      ],
      new Set(),
    );

    expect(total).toBe(0);
  });

  it('returns 0 when local updatedAt is not a positive number (A3)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 0 }],
      [{ id: 'shared', updatedat: -1 }],
      new Set(),
    );

    expect(total).toBe(0);
  });

  it('returns 0 for an older local time even when empty revision meta would upsert (D-01)', () => {
    const entry = { id: 'shared', updatedAt: 1_700_000_001_000 };
    expect(shouldUpsertEntry(entry, emptyRevisionMeta())).toBe(true);

    const total = countReplaceableSharedIds(
      [entry],
      [{ id: 'shared', updatedat: 1_700_000_002_000 }],
      new Set(),
    );

    expect(total).toBe(0);
  });

  it('returns 0 for an empty cloud list (D-10)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'local-only', updatedAt: 1_700_000_002_000 }],
      [],
      new Set(),
    );

    expect(total).toBe(0);
  });

  it('moves from 0 to 1 when local updatedAt becomes strictly newer (roadmap)', () => {
    const cloud = [{ id: 'shared', updatedat: 1_700_000_002_000 }];
    const before = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 1_700_000_001_000 }],
      cloud,
      new Set(),
    );
    const after = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 1_700_000_003_000 }],
      cloud,
      new Set(),
    );

    expect(before).toBe(0);
    expect(after).toBe(1);
  });
});
