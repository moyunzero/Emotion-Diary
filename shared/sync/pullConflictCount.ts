/**
 * Count of shared ids a cloud merge would replace.
 * The predicate is local updatedAt strictly greater than that cloud row's
 * updatedat after ensureMilliseconds. This module does not classify fetch errors.
 */

import { ensureMilliseconds } from "../formatting";

/** Local revision fields used by the count. Diary body is not part of the type. */
export type LocalRevisionRow = {
  id: string;
  updatedAt?: number;
};

/** Cloud revision fields used by the count. Diary body is not part of the type. */
export type CloudRevisionRow = {
  id: string;
  updatedat?: unknown;
};

/**
 * Count shared ids whose local updatedAt is strictly newer than the cloud updatedat.
 * Returns a number only.
 */
export function countReplaceableSharedIds(
  localRows: readonly LocalRevisionRow[],
  cloudRows: readonly CloudRevisionRow[],
  tombstoneIds: ReadonlySet<string>,
): number {
  const localById = new Map<string, LocalRevisionRow>();
  for (const row of localRows) {
    localById.set(row.id, row);
  }

  let total = 0;
  for (const cloud of cloudRows) {
    if (tombstoneIds.has(cloud.id)) {
      continue;
    }
    const local = localById.get(cloud.id);
    if (!local) {
      continue;
    }
    if (typeof local.updatedAt !== "number" || typeof cloud.updatedat !== "number") {
      continue;
    }
    if (
      ensureMilliseconds(local.updatedAt) > ensureMilliseconds(cloud.updatedat)
    ) {
      total += 1;
    }
  }
  return total;
}
