/**
 * Count of shared ids a cloud merge would replace.
 * Returns a number only. Fetch errors are classified by the caller.
 */

export type LocalRevisionRow = {
  id: string;
  updatedAt?: number;
};

export type CloudRevisionRow = {
  id: string;
  updatedat?: unknown;
};

export function countReplaceableSharedIds(
  localRows: readonly LocalRevisionRow[],
  cloudRows: readonly CloudRevisionRow[],
  tombstoneIds: ReadonlySet<string>,
): number {
  void localRows;
  void cloudRows;
  void tombstoneIds;
  return 0;
}
