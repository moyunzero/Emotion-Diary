/**
 * 云端「显式删除」条目（墓碑）相关的纯函数。
 *
 * B-3 / CONCERNS H3：禁止再用「云端有但本地无」做差集 DELETE。
 * `entry_tombstones` 由**显式永久清除**或既有同步管线写入（例如需物理删云时登记）；**普通 `deleteEntry` 不写墓碑**，
 * 产品方向见 `openspec/changes/002-entry-backup-soft-delete/SPEC.md`（软删 + 快照恢复）。
 * `syncFromCloud` / `recoverFromCloud` 仍会按墓碑过滤云端行；`syncToCloud` 可对已登记 id 物理删云。
 */

/**
 * 将 Supabase `entry_tombstones` 查询结果规范为去重后的 `entry_id` 列表。
 * 忽略 null / 空串 / 重复项，保持首次出现顺序。
 */
export function collectTombstoneEntryIds(
  rows: { entry_id?: string | null }[] | null | undefined,
): string[] {
  if (!rows || rows.length === 0) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const id = row.entry_id;
    if (typeof id !== "string" || id.trim() === "") {
      continue;
    }
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * 从待同步列表中剔除已登记墓碑的条目，防止墓碑删云后本地脏数据把行又 upsert 回去。
 */
export function filterOutTombstonedEntries<T extends { id: string }>(
  items: readonly T[],
  tombstoneIds: ReadonlySet<string>,
): T[] {
  if (tombstoneIds.size === 0) {
    return items.length === 0 ? [] : [...items];
  }
  return items.filter((item) => !tombstoneIds.has(item.id));
}
