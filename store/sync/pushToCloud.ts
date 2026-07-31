import type { StoreApi } from "zustand";
import { supabase } from "../../lib/supabase";
import { uploadPendingAudios } from "../../services/audioSync";
import { fetchUserTombstoneEntryIds } from "../../services/entryTombstones";
import { applyAudioUploadResults } from "../../shared/audio/sync";
import {
  advanceLastSyncedAfterSuccess,
  loadRevisionMeta,
  saveRevisionMeta,
  shouldUpsertEntry,
} from "../../shared/sync/revisionMeta";
import { releaseSyncLock, tryBeginSync } from "../../shared/sync/syncLock";
import { filterOutTombstonedEntries } from "../../shared/sync/tombstone";
import { i18n } from "../../i18n";
import { logger } from "../../utils/logger";
import type { AppState } from "../modules/types";
import { getSyncErrorMessage } from "./syncErrors";

export async function runPushToCloud(
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

  const begin = tryBeginSync();
  if (!begin.proceed) {
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

    const {
      tombstoneIdsArr,
      tombstoneIdSet,
      tombstoneFetchError,
    } = await fetchUserTombstoneEntryIds(supabase, currentUserId);

    if (tombstoneFetchError) {
      console.warn("获取 entry_tombstones 失败:", tombstoneFetchError);
    }

    const afterTombstone = filterOutTombstonedEntries(entries, tombstoneIdSet);

    let revisionMeta = await loadRevisionMeta(currentUserId);
    const entriesNeedingUpsert = afterTombstone.filter((entry) => {
      const updatedAt =
        typeof entry.updatedAt === "number" && entry.updatedAt > 0
          ? entry.updatedAt
          : entry.timestamp;
      return shouldUpsertEntry({ id: entry.id, updatedAt }, revisionMeta);
    });

    const entriesToSync = entriesNeedingUpsert.map((entry) => {
      const peopleArray = Array.isArray(entry.people) ? entry.people : [];
      const triggersArray = Array.isArray(entry.triggers)
        ? entry.triggers
        : [];

      return {
        id: entry.id,
        timestamp: entry.timestamp,
        moodlevel: entry.moodLevel || 1,
        content: entry.content || "",
        deadline: entry.deadline || "later",
        people: peopleArray,
        triggers: triggersArray,
        status: entry.status || "active",
        resolvedat: entry.resolvedAt || null,
        burnedat: entry.burnedAt || null,
        deletedat:
          typeof entry.deletedAt === "number" && entry.deletedAt > 0
            ? entry.deletedAt
            : null,
        updatedat:
          typeof entry.updatedAt === "number" && entry.updatedAt > 0
            ? entry.updatedAt
            : entry.timestamp,
        user_id: currentUserId,
        audios: entry.audios || [],
      };
    });

    const { data: existingCloudData, error: fetchError } = await supabase
      .from("entries")
      .select("id, user_id")
      .eq("user_id", currentUserId);

    if (fetchError) {
      console.warn("获取云端数据失败:", fetchError);
    }

    if (tombstoneIdsArr.length > 0) {
      const { error: purgeError } = await supabase
        .from("entries")
        .delete()
        .in("id", tombstoneIdsArr)
        .eq("user_id", currentUserId);

      if (purgeError) {
        console.warn(
          "[syncToCloud] 按墓碑删除云端 entries 失败:",
          purgeError,
        );
      }
    }

    const successfulUpsertIds = new Set<string>();

    if (entriesToSync.length > 0) {
      try {
        const { error: upsertError } = await supabase
          .from("entries")
          .upsert(entriesToSync, {
            onConflict: "id",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          if (upsertError.code === "42501") {
            if (fetchError) {
              throw fetchError;
            }

            if (__DEV__) console.log("upsert 遇到 RLS 问题，使用分离的 insert/update 操作");

            const existingIds = new Set(
              existingCloudData ? existingCloudData.map((e) => e.id) : [],
            );

            const newEntries = entriesToSync.filter(
              (e) => !existingIds.has(e.id),
            );
            let updateEntries = entriesToSync.filter((e) =>
              existingIds.has(e.id),
            );

            if (newEntries.length > 0) {
              const { error: insertError } = await supabase
                .from("entries")
                .insert(newEntries);

              if (insertError?.code === "23505") {
                updateEntries = [...updateEntries, ...newEntries];
              } else if (insertError) {
                throw insertError;
              } else {
                for (const e of newEntries) {
                  successfulUpsertIds.add(e.id);
                }
              }
            }

            if (updateEntries.length > 0) {
              for (const entry of updateEntries) {
                const { error: updateError } = await supabase
                  .from("entries")
                  .update({
                    timestamp: entry.timestamp,
                    moodlevel: entry.moodlevel,
                    content: entry.content,
                    deadline: entry.deadline,
                    people: entry.people,
                    triggers: entry.triggers,
                    status: entry.status,
                    resolvedat: entry.resolvedat,
                    burnedat: entry.burnedat,
                    deletedat: entry.deletedat,
                    updatedat: entry.updatedat,
                    audios: entry.audios || [],
                  })
                  .eq("id", entry.id)
                  .eq("user_id", currentUserId);

                if (updateError) {
                  logger.warn(
                    "store",
                    `更新记录 ${entry.id} 失败`,
                    updateError,
                  );
                } else {
                  successfulUpsertIds.add(entry.id);
                }
              }
            }
          } else {
            throw upsertError;
          }
        } else {
          for (const e of entriesToSync) {
            successfulUpsertIds.add(e.id);
          }
        }
      } catch (error: unknown) {
        logger.error("store", "同步记录失败", error);
        logger.error(
          "store",
          "失败的记录数量",
          entriesToSync.length,
        );
        const sample = entriesToSync[0];
        if (sample) {
          logger.error("store", "第一条记录示例", {
            id: sample.id,
            updatedat: sample.updatedat,
            peopleCount: Array.isArray(sample.people)
              ? sample.people.length
              : 0,
            triggersCount: Array.isArray(sample.triggers)
              ? sample.triggers.length
              : 0,
            audiosCount: Array.isArray(sample.audios)
              ? sample.audios.length
              : 0,
          });
        }

        const pgCode =
          error !== null &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code?: string }).code === "23514";

        if (pgCode) {
          const e = error as {
            message?: string;
            details?: string;
            hint?: string;
          };
          logger.error("store", "数据库约束检查失败 (23514)", {
            message: e.message,
            details: e.details,
            hint: e.hint,
          });

          throw new Error(
            i18n.t("errors.dbConstraintFailed", { ns: "system" }),
          );
        }

        throw error;
      }

      if (successfulUpsertIds.size > 0) {
        revisionMeta = advanceLastSyncedAfterSuccess(
          revisionMeta,
          entriesToSync.map((e) => ({
            id: e.id,
            updatedAt: e.updatedat,
          })),
          successfulUpsertIds,
        );
        await saveRevisionMeta(currentUserId, revisionMeta);
      }
    }

    if (__DEV__) console.log("成功同步到云端");

    await get()._syncFirstEntryDateToCloud();

    try {
      const allAudios = entries
        .flatMap((e) => e.audios || [])
        .filter(
          (a) =>
            a.syncStatus === "pending" || a.syncStatus === "failed",
        );

      if (allAudios.length > 0) {
        const uploadResult = await uploadPendingAudios(
          allAudios,
          currentUserId,
        );
        if (__DEV__) {
          console.log(
            `音频同步完成: 成功 ${uploadResult.success}, 失败 ${uploadResult.failed}`,
          );
        }

        if (
          uploadResult.results.size > 0 ||
          uploadResult.failedAudioIds.length > 0
        ) {
          const failedSet = new Set(uploadResult.failedAudioIds);
          const { updatedEntries, writeback } = applyAudioUploadResults(
            entries,
            uploadResult.results,
            failedSet,
          );

          set({ entries: updatedEntries });
          get()._saveEntries();

          const failedWritebackIds: string[] = [];
          for (const payload of writeback) {
            const { error: writebackError } = await supabase
              .from("entries")
              .update({ audios: payload.audios })
              .eq("id", payload.id)
              .eq("user_id", currentUserId);

            if (writebackError) {
              failedWritebackIds.push(payload.id);
              logger.warn(
                "store",
                `回写 entry ${payload.id} 的 audios 元数据失败`,
                writebackError,
              );
            }
          }

          if (failedWritebackIds.length > 0) {
            const lastSyncedUpdatedAtByEntryId = {
              ...revisionMeta.lastSyncedUpdatedAtByEntryId,
            };
            for (const id of failedWritebackIds) {
              delete lastSyncedUpdatedAtByEntryId[id];
            }
            revisionMeta = {
              ...revisionMeta,
              lastSyncedUpdatedAtByEntryId,
            };
            await saveRevisionMeta(currentUserId, revisionMeta);
          }
        }

        if (uploadResult.failed > 0) {
          logger.warn(
            "store",
            `[syncToCloud] ${uploadResult.failed} 条语音上传失败，已标记 failed，可重试`,
          );
        }
      }
    } catch (audioError) {
      logger.error("store", "音频同步失败", audioError);
    }

    set({ syncStatus: "idle" });
    return true;
  } catch (error) {
    const errorMsg = getSyncErrorMessage(error);
    console.error("同步到云端失败:", errorMsg);
    set({ syncStatus: "error" });
    throw new Error(errorMsg);
  } finally {
    releaseSyncLock();
    setTimeout(() => onFinally(), 100);
  }
}
