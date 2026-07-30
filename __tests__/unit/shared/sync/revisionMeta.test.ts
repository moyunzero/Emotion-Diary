/**
 * shared/sync/revisionMeta.ts — Wave 0 stubs for SYNC-01/02 (D-01, D-03, D-07, D-09).
 *
 * Expected exports (Plan 08-02 / 08-03):
 * - backfillUpdatedAt
 * - withBumpedUpdatedAt
 * - shouldUpsertEntry
 * - advanceLastSyncedAfterSuccess
 * - SyncRevisionMeta (type)
 *
 * RED until those helpers land; do not describe.skip this file.
 */

import {
  advanceLastSyncedAfterSuccess,
  backfillUpdatedAt,
  shouldUpsertEntry,
  withBumpedUpdatedAt,
  type SyncRevisionMeta,
} from '../../../../shared/sync/revisionMeta';

/** Minimal entry shape for revision helpers (updatedAt arrives with SYNC-01). */
type RevisionEntry = {
  id: string;
  timestamp: number;
  updatedAt?: number;
};

const emptyMeta = (): SyncRevisionMeta => ({
  lastSyncedUpdatedAtByEntryId: {},
  pullCursorUpdatedAt: null,
});

describe('backfillUpdatedAt', () => {
  it('missing updatedAt → uses entry.timestamp (D-03)', () => {
    const entry: RevisionEntry = { id: 'e1', timestamp: 1_700_000_000_000 };
    const out = backfillUpdatedAt(entry);
    expect(out.updatedAt).toBe(1_700_000_000_000);
  });

  it('invalid / non-positive updatedAt → uses entry.timestamp (D-03)', () => {
    const entry: RevisionEntry = {
      id: 'e1',
      timestamp: 1_700_000_000_100,
      updatedAt: 0,
    };
    const out = backfillUpdatedAt(entry);
    expect(out.updatedAt).toBe(1_700_000_000_100);
  });

  it('valid updatedAt preserved', () => {
    const entry: RevisionEntry = {
      id: 'e1',
      timestamp: 1_700_000_000_000,
      updatedAt: 1_700_000_000_500,
    };
    const out = backfillUpdatedAt(entry);
    expect(out.updatedAt).toBe(1_700_000_000_500);
  });
});

describe('withBumpedUpdatedAt (bump)', () => {
  it('returns new object with wall-clock updatedAt, not diary event timestamp (D-01)', () => {
    const eventTs = 1_600_000_000_000;
    const entry: RevisionEntry = {
      id: 'e1',
      timestamp: eventTs,
      updatedAt: eventTs,
    };
    const before = Date.now();
    const out = withBumpedUpdatedAt(entry);
    const after = Date.now();

    expect(out).not.toBe(entry);
    expect(out.updatedAt).toBeGreaterThanOrEqual(before);
    expect(out.updatedAt).toBeLessThanOrEqual(after);
    expect(out.updatedAt).not.toBe(eventTs);
    expect(out.timestamp).toBe(eventTs);
  });
});

describe('shouldUpsertEntry (shouldUpsert)', () => {
  it('never-synced (no map key) → true (D-07)', () => {
    const entry = { id: 'e1', updatedAt: 100 };
    expect(shouldUpsertEntry(entry, emptyMeta())).toBe(true);
  });

  it('updatedAt > lastSynced → true (D-07)', () => {
    const meta: SyncRevisionMeta = {
      lastSyncedUpdatedAtByEntryId: { e1: 50 },
      pullCursorUpdatedAt: null,
    };
    expect(shouldUpsertEntry({ id: 'e1', updatedAt: 100 }, meta)).toBe(true);
  });

  it('updatedAt <= lastSynced → false (D-07)', () => {
    const meta: SyncRevisionMeta = {
      lastSyncedUpdatedAtByEntryId: { e1: 100 },
      pullCursorUpdatedAt: null,
    };
    expect(shouldUpsertEntry({ id: 'e1', updatedAt: 100 }, meta)).toBe(false);
    expect(shouldUpsertEntry({ id: 'e1', updatedAt: 99 }, meta)).toBe(false);
  });
});

describe('advanceLastSyncedAfterSuccess (advance)', () => {
  it('only successful ids get lastSyncedUpdatedAt = entry.updatedAt; failures unchanged (D-09)', () => {
    const meta: SyncRevisionMeta = {
      lastSyncedUpdatedAtByEntryId: {
        ok: 10,
        fail: 20,
        untouched: 30,
      },
      pullCursorUpdatedAt: null,
    };
    const entries = [
      { id: 'ok', updatedAt: 111 },
      { id: 'fail', updatedAt: 222 },
      { id: 'untouched', updatedAt: 333 },
    ];
    const next = advanceLastSyncedAfterSuccess(meta, entries, new Set(['ok']));

    expect(next.lastSyncedUpdatedAtByEntryId.ok).toBe(111);
    expect(next.lastSyncedUpdatedAtByEntryId.fail).toBe(20);
    expect(next.lastSyncedUpdatedAtByEntryId.untouched).toBe(30);
    expect(next).not.toBe(meta);
  });
});
