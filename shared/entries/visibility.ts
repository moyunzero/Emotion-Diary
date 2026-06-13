/**
 * 条目在主界面/统计中的可见性（软删）。
 * 与 `openspec/changes/002-entry-backup-soft-delete/SPEC.md` 对齐。
 */

import type { MoodEntry } from "../../types";

/** 已软删：`deletedAt` 为正毫秒时间戳 */
export function isSoftDeleted(entry: Pick<MoodEntry, "deletedAt">): boolean {
  return typeof entry.deletedAt === "number" && entry.deletedAt > 0;
}

/** 主列表、天气、洞察等默认使用的集合 */
export function excludeSoftDeletedEntries(entries: readonly MoodEntry[]): MoodEntry[] {
  return entries.filter((e) => !isSoftDeleted(e));
}

/** 回收站：仅已软删条目，按 `deletedAt` 降序（无 deletedAt 的软删条按 timestamp 兜底） */
export function onlySoftDeletedEntries(entries: readonly MoodEntry[]): MoodEntry[] {
  return entries
    .filter((e) => isSoftDeleted(e))
    .sort((a, b) => {
      const aDel = typeof a.deletedAt === "number" ? a.deletedAt : 0;
      const bDel = typeof b.deletedAt === "number" ? b.deletedAt : 0;
      if (bDel !== aDel) return bDel - aDel;
      return b.timestamp - a.timestamp;
    });
}

/** 新建条目的稳定 UUID（v4） */
export function generateEntryId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
