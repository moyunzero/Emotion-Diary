/**
 * Sync revision helpers — bump/backfill (SYNC-01); skip/advance stubs until Plan 08-03 (SYNC-02).
 */

export type SyncRevisionMeta = {
  lastSyncedUpdatedAtByEntryId: Record<string, number>;
  /** Skeleton only — do not filter pull yet (D-06) */
  pullCursorUpdatedAt: number | null;
};

type RevisionFields = {
  timestamp: number;
  updatedAt?: number;
};

/** Fill missing / non-positive updatedAt from diary event timestamp (D-03). */
export function backfillUpdatedAt<T extends RevisionFields>(
  entry: T,
): T & { updatedAt: number } {
  const current = entry.updatedAt;
  if (typeof current === 'number' && current > 0) {
    return entry as T & { updatedAt: number };
  }
  return { ...entry, updatedAt: entry.timestamp };
}

/** Wall-clock bump for D-01 writers; does not change diary event timestamp. */
export function withBumpedUpdatedAt<T extends object>(
  entry: T,
): T & { updatedAt: number } {
  return { ...entry, updatedAt: Date.now() };
}

/** SYNC-02 — implemented in Plan 08-03. */
export function shouldUpsertEntry(
  _entry: { id: string; updatedAt: number },
  _meta: SyncRevisionMeta,
): boolean {
  throw new Error('shouldUpsertEntry: implement in Plan 08-03');
}

/** SYNC-02 — implemented in Plan 08-03. */
export function advanceLastSyncedAfterSuccess(
  _meta: SyncRevisionMeta,
  _entries: readonly { id: string; updatedAt: number }[],
  _successfulIds: ReadonlySet<string>,
): SyncRevisionMeta {
  throw new Error('advanceLastSyncedAfterSuccess: implement in Plan 08-03');
}
