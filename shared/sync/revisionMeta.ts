/**
 * Sync revision helpers — bump/backfill (SYNC-01); push-side skip/advance (SYNC-02).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncRevisionMeta = {
  lastSyncedUpdatedAtByEntryId: Record<string, number>;
  /** Skeleton only — do not filter pull yet (D-06) */
  pullCursorUpdatedAt: number | null;
};

type RevisionFields = {
  timestamp: number;
  updatedAt?: number;
};

/** AsyncStorage key for per-user revision meta (discretion A1). */
export function revisionMetaStorageKey(userId: string): string {
  return `sync_revision_meta_${userId}`;
}

export function emptyRevisionMeta(): SyncRevisionMeta {
  return {
    lastSyncedUpdatedAtByEntryId: {},
    pullCursorUpdatedAt: null,
  };
}

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

/** Upsert when never synced or client revision is newer (D-07). */
export function shouldUpsertEntry(
  entry: { id: string; updatedAt: number },
  meta: SyncRevisionMeta,
): boolean {
  const last = meta.lastSyncedUpdatedAtByEntryId[entry.id];
  return last == null || entry.updatedAt > last;
}

/**
 * Advance lastSyncedUpdatedAt only for successful ids (D-09).
 * Returns a new meta object; does not mutate input.
 */
export function advanceLastSyncedAfterSuccess(
  meta: SyncRevisionMeta,
  entries: readonly { id: string; updatedAt: number }[],
  successfulIds: ReadonlySet<string>,
): SyncRevisionMeta {
  const lastSyncedUpdatedAtByEntryId = {
    ...meta.lastSyncedUpdatedAtByEntryId,
  };
  for (const entry of entries) {
    if (successfulIds.has(entry.id)) {
      lastSyncedUpdatedAtByEntryId[entry.id] = entry.updatedAt;
    }
  }
  return {
    ...meta,
    lastSyncedUpdatedAtByEntryId,
  };
}

function isRevisionMeta(value: unknown): value is SyncRevisionMeta {
  if (value == null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (
    v.lastSyncedUpdatedAtByEntryId == null ||
    typeof v.lastSyncedUpdatedAtByEntryId !== 'object' ||
    Array.isArray(v.lastSyncedUpdatedAtByEntryId)
  ) {
    return false;
  }
  const cursor = v.pullCursorUpdatedAt;
  return cursor === null || typeof cursor === 'number';
}

/** Load per-user sync revision meta; empty map on miss/corrupt (D-08). */
export async function loadRevisionMeta(
  userId: string,
): Promise<SyncRevisionMeta> {
  try {
    const raw = await AsyncStorage.getItem(revisionMetaStorageKey(userId));
    if (!raw) return emptyRevisionMeta();
    const parsed: unknown = JSON.parse(raw);
    if (!isRevisionMeta(parsed)) return emptyRevisionMeta();
    return {
      lastSyncedUpdatedAtByEntryId: {
        ...parsed.lastSyncedUpdatedAtByEntryId,
      },
      pullCursorUpdatedAt: parsed.pullCursorUpdatedAt,
    };
  } catch {
    return emptyRevisionMeta();
  }
}

/** Persist per-user sync revision meta (local-only; T-08-02). */
export async function saveRevisionMeta(
  userId: string,
  meta: SyncRevisionMeta,
): Promise<void> {
  await AsyncStorage.setItem(
    revisionMetaStorageKey(userId),
    JSON.stringify(meta),
  );
}
