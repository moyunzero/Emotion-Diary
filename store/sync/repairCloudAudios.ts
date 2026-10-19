import { supabase } from "../../lib/supabase";
import {
  audioNeedsCloudUpload,
  uploadPendingAudios,
} from "../../services/audioSync";
import { applyAudioUploadResults } from "../../shared/audio/sync";
import {
  loadRevisionMeta,
  saveRevisionMeta,
} from "../../shared/sync/revisionMeta";
import { releaseSyncLock, tryBeginSync } from "../../shared/sync/syncLock";
import { logger } from "../../utils/logger";
import type { AppState } from "../modules/types";

/**
 * 登录并载入本地日记后自动补传仍在本机的录音。
 * 不走整库备份。别的设备上的路径读不到就跳过，不把云端标成失败。
 */
export async function repairCloudAudios(
  get: () => AppState,
  set: (partial: Partial<AppState>) => void,
  onFinally?: () => void,
): Promise<void> {
  const { user, entries } = get();
  if (!user) return;

  const candidates = entries
    .flatMap((entry) => entry.audios ?? [])
    .filter(audioNeedsCloudUpload);
  if (candidates.length === 0) return;

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || session?.user?.id !== user.id) return;

  const begin = tryBeginSync();
  if (!begin.proceed) return;

  try {
    const uploadResult = await uploadPendingAudios(candidates, user.id);
    if (
      uploadResult.results.size === 0 &&
      uploadResult.failedAudioIds.length === 0
    ) {
      return;
    }

    const failedSet = new Set(uploadResult.failedAudioIds);
    const { updatedEntries, writeback } = applyAudioUploadResults(
      get().entries,
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
        .eq("user_id", user.id);

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
      const revisionMeta = await loadRevisionMeta(user.id);
      const lastSyncedUpdatedAtByEntryId = {
        ...revisionMeta.lastSyncedUpdatedAtByEntryId,
      };
      for (const id of failedWritebackIds) {
        delete lastSyncedUpdatedAtByEntryId[id];
      }
      await saveRevisionMeta(user.id, {
        ...revisionMeta,
        lastSyncedUpdatedAtByEntryId,
      });
    }
  } finally {
    releaseSyncLock();
    onFinally?.();
  }
}
