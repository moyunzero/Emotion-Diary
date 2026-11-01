/**
 * Dashboard 列表过滤：单次遍历分桶，避免「全部」筛选下多次 filter+sort。
 */

import type { MoodEntry } from "../../types";
import { Status } from "../../types";
import { isSoftDeleted } from "./visibility";

export type DashboardFilterType = "all" | "active" | "resolved" | "burned";

function sortByTimestampDesc(entries: MoodEntry[]): MoodEntry[] {
  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * 从全量 entries 中过滤软删并按 Dashboard 筛选规则返回列表。
 */
export function filterDashboardEntries(
  entries: readonly MoodEntry[],
  filter: DashboardFilterType,
): MoodEntry[] {
  const active: MoodEntry[] = [];
  const resolved: MoodEntry[] = [];
  const burned: MoodEntry[] = [];

  for (const entry of entries) {
    if (isSoftDeleted(entry)) continue;
    switch (entry.status) {
      case Status.ACTIVE:
        active.push(entry);
        break;
      case Status.RESOLVED:
        resolved.push(entry);
        break;
      case Status.BURNED:
        burned.push(entry);
        break;
      default:
        break;
    }
  }

  sortByTimestampDesc(active);
  sortByTimestampDesc(resolved);
  sortByTimestampDesc(burned);

  switch (filter) {
    case "active":
      return active;
    case "resolved":
      return resolved;
    case "burned":
      return burned;
    default:
      return [...active, ...resolved, ...burned];
  }
}

/**
 * 花园「待处理」与首页「未处理」共用：ACTIVE 且未软删的条数。
 */
export function countPendingEntries(entries: readonly MoodEntry[]): number {
  let count = 0;
  for (const entry of entries) {
    if (isSoftDeleted(entry)) continue;
    if (entry.status === Status.ACTIVE) count += 1;
  }
  return count;
}

export function getDashboardEntryItemType(entry: MoodEntry): string {
  switch (entry.status) {
    case Status.RESOLVED:
      return "resolved";
    case Status.BURNED:
      return "burned";
    default:
      return "active";
  }
}
