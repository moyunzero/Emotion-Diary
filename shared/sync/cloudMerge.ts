/**
 * syncFromCloud / recoverFromCloud 的条目合并语义（纯函数）。
 *
 * - 本地与云端均先按墓碑 id 过滤（本地侧在此函数内处理）。
 * - Map：先放入本地独有 id，再以云端行 set 同 id（**同 id 以云端为准**）。
 * - 结果按 timestamp 降序。
 *
 * 云端行列表应已剔除墓碑 id（与 useAppStore 拉取后 filter 一致）。
 */

import type { MoodEntry } from "../../types";
import { filterOutTombstonedEntries } from "./tombstone";

export function mergeCloudPullEntries(
  localEntries: MoodEntry[],
  cloudEntries: MoodEntry[],
  tombstoneIdSet: Set<string>,
): MoodEntry[] {
  const localForMerge = filterOutTombstonedEntries(localEntries, tombstoneIdSet);
  const mergedMap = new Map<string, MoodEntry>();

  localForMerge.forEach((entry) => {
    mergedMap.set(entry.id, entry);
  });

  for (const cloudEntry of cloudEntries) {
    mergedMap.set(cloudEntry.id, cloudEntry);
  }

  const merged = Array.from(mergedMap.values());
  merged.sort((a, b) => b.timestamp - a.timestamp);
  return merged;
}
