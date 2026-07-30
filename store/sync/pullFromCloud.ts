import { ensureMilliseconds } from "@/shared/formatting";
import type { StoreApi } from "zustand";
import { supabase } from "../../lib/supabase";
import { fetchUserTombstoneEntryIds } from "../../services/entryTombstones";
import { mergeCloudPullEntries } from "../../shared/sync/cloudMerge";
import { releaseSyncLock, tryBeginSync } from "../../shared/sync/syncLock";
import { filterOutTombstonedEntries } from "../../shared/sync/tombstone";
import { i18n } from "../../i18n";
import { getStorageKey, saveToStorage } from "../modules/storage";
import type { AppState } from "../modules/types";
import { getSyncErrorMessage } from "./syncErrors";

export async function runPullFromCloud(
  get: () => AppState,
  set: StoreApi<AppState>["setState"],
  onFinally: () => void,
): Promise<boolean> {
  const { user, entries } = get();

  if (!user) {
    console.error("用户未登录");
    set({ syncStatus: "error" });
    return false;
  }

  const beginPull = tryBeginSync();
  if (!beginPull.proceed) {
    if (__DEV__) console.log("同步操作正在进行中，标记为待处理");
    set({ syncStatus: "pending" });
    return false;
  }

  set({ syncStatus: "syncing" });

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error(
        i18n.t("errors.sessionVerifyFailed", { ns: "system" }),
      );
    }

    if (session.user.id !== user.id) {
      throw new Error(
        i18n.t("errors.identityVerifyFailed", { ns: "system" }),
      );
    }

    const currentUserId = session.user.id;

    const { tombstoneIdSet, tombstoneFetchError } =
      await fetchUserTombstoneEntryIds(supabase, currentUserId);

    if (tombstoneFetchError) {
      console.warn("获取 entry_tombstones 失败:", tombstoneFetchError);
    }

    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", currentUserId)
      .order("timestamp", { ascending: false });

    if (error) {
      const errorMsg = getSyncErrorMessage(error);
      throw new Error(errorMsg);
    }

    if (!data || data.length === 0) {
      const pruned = filterOutTombstonedEntries(entries, tombstoneIdSet);
      if (pruned.length !== entries.length) {
        set({ entries: pruned });
        const storageKey = getStorageKey(currentUserId);
        await saveToStorage(storageKey, pruned);
        get()._calculateWeather();
      }

      await get()._syncFirstEntryDateFromCloud();

      set({ syncStatus: "idle" });
      return true;
    }

    const transformedCloudData = data
      .filter((cloudEntry) => {
        const entryUserId = cloudEntry.user_id || cloudEntry.userId;
        return entryUserId === currentUserId;
      })
      .map((cloudEntry) => {
        const rawDeleted =
          cloudEntry.deletedat ?? cloudEntry.deletedAt ?? null;
        const deletedAtMs =
          rawDeleted != null && typeof rawDeleted === "number"
            ? ensureMilliseconds(rawDeleted)
            : null;
        return {
          ...cloudEntry,
          moodLevel: cloudEntry.moodlevel || cloudEntry.moodLevel || 1,
          status: cloudEntry.status || "active",
          resolvedAt: cloudEntry.resolvedat
            ? ensureMilliseconds(cloudEntry.resolvedat)
            : cloudEntry.resolvedAt,
          burnedAt: cloudEntry.burnedat
            ? ensureMilliseconds(cloudEntry.burnedat)
            : cloudEntry.burnedAt,
          timestamp: ensureMilliseconds(cloudEntry.timestamp),
          deletedAt: deletedAtMs,
          updatedAt: ensureMilliseconds(
            cloudEntry.updatedat ??
              cloudEntry.updatedAt ??
              cloudEntry.timestamp,
          ),
        };
      })
      .filter((cloudEntry) => !tombstoneIdSet.has(cloudEntry.id));

    const uniqueMergedEntries = mergeCloudPullEntries(
      entries,
      transformedCloudData,
      tombstoneIdSet,
    );

    set({ entries: uniqueMergedEntries });

    const storageKey = getStorageKey(currentUserId);
    await saveToStorage(storageKey, uniqueMergedEntries);

    get()._calculateWeather();

    if (__DEV__) console.log("成功从云端同步数据");

    await get()._syncFirstEntryDateFromCloud();

    set({ syncStatus: "idle" });
    return true;
  } catch (error) {
    const errorMsg = getSyncErrorMessage(error);
    console.error("从云端同步失败:", errorMsg);
    set({ syncStatus: "error" });
    throw new Error(errorMsg);
  } finally {
    releaseSyncLock();
    setTimeout(() => onFinally(), 100);
  }
}
