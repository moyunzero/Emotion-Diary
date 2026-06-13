/**
 * 拉取当前用户在 `entry_tombstones` 中的条目 id（供 syncToCloud / syncFromCloud 共用）。
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { collectTombstoneEntryIds } from "@/shared/sync/tombstone";

export type UserTombstoneFetchResult = {
  tombstoneIdsArr: string[];
  tombstoneIdSet: Set<string>;
  tombstoneFetchError: { message: string } | null;
};

/**
 * 查询 `entry_tombstones` 并规范为去重 id 列表与 Set。
 * 与历史 `useAppStore` 行为一致：即使 `error` 非空仍对 `data` 调用 `collectTombstoneEntryIds`（可能为空）。
 */
export async function fetchUserTombstoneEntryIds(
  client: SupabaseClient,
  userId: string,
): Promise<UserTombstoneFetchResult> {
  const { data: tombstoneRows, error: tombstoneFetchError } = await client
    .from("entry_tombstones")
    .select("entry_id")
    .eq("user_id", userId);

  const tombstoneIdsArr = collectTombstoneEntryIds(tombstoneRows);

  return {
    tombstoneIdsArr,
    tombstoneIdSet: new Set(tombstoneIdsArr),
    tombstoneFetchError: tombstoneFetchError,
  };
}

/**
 * 登记永久删除墓碑（`purgeEntryForever` 路径）。
 * 重复插入（23505）视为成功。
 */
export async function insertEntryTombstone(
  client: SupabaseClient,
  userId: string,
  entryId: string,
): Promise<{ error: { message: string; code?: string } | null }> {
  const { error } = await client.from("entry_tombstones").insert({
    user_id: userId,
    entry_id: entryId,
  });

  if (!error) {
    return { error: null };
  }

  if (error.code === "23505") {
    return { error: null };
  }

  return { error: { message: error.message, code: error.code } };
}
