/**
 * Profile 同步流程：syncToCloud、recoverFromCloud；与 store.syncStatus 对齐
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";
import { Alert } from "react-native";
import { i18n } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { excludeSoftDeletedEntries } from "@/shared/entries/visibility";
import { countPullConflicts } from "@/store/sync/countPullConflicts";
import { useAppStore } from "@/store/useAppStore";
import { logger } from "@/utils/logger";
import { formatLastSyncTimeValue } from "../utils/formatLastSyncTime";
import { SYNC_FLASH_MS, flashSyncProgress } from "../utils/syncChrome";
import { mergeConfirmForCount, presentMergeConfirm } from "./mergeConfirm";
import type { MutableRefObject } from "react";

type StateRef = {
  isSyncingRef: MutableRefObject<boolean>;
  setIsLoading: (v: boolean) => void;
  setIsLoginModalOpen: (v: boolean) => void;
  setIsRegisterMode: (v: boolean) => void;
};

export function useProfileSyncHandlers(state: StateRef) {
  const syncToCloud = useAppStore((s) => s.syncToCloud);
  const recoverFromCloud = useAppStore((s) => s.recoverFromCloud);
  const storeSyncStatus = useAppStore((s) => s.syncStatus);
  const user = useAppStore((s) => s.user);
  const effectiveLocale = useAppStore((s) => s.effectiveLocale);

  const runSyncAction = useCallback(
    async (type: "upload" | "download") => {
      if (!user) {
        state.setIsRegisterMode(false);
        state.setIsLoginModalOpen(true);
        return;
      }

      const { isSyncingRef, setIsLoading } = state;
      if (isSyncingRef.current) return;

      isSyncingRef.current = true;
      setIsLoading(true);
      // Set syncing before progress so idle+progress never flashes CheckCircle (D-15)
      useAppStore.setState({
        syncStatus: "syncing",
        syncProgress:
          type === "upload"
            ? i18n.t("upload.progress", { ns: "sync" })
            : i18n.t("pull.progress", { ns: "sync" }),
      });

      try {
        const ok =
          type === "upload"
            ? await syncToCloud()
            : await recoverFromCloud();

        if (!ok) {
          const status = useAppStore.getState().syncStatus;
          const apply = useAppStore.setState.bind(useAppStore);
          if (status === "pending") {
            flashSyncProgress(
              apply,
              { syncProgress: i18n.t("pendingMessage", { ns: "sync" }) },
              2500,
            );
            return;
          }
          if (status === "error") {
            flashSyncProgress(
              apply,
              { syncProgress: i18n.t("notLoggedIn", { ns: "sync" }) },
              3000,
            );
            return;
          }
          flashSyncProgress(
            apply,
            {
              syncStatus: "error",
              syncProgress: i18n.t("sync.operationIncomplete", { ns: "system" }),
            },
            3000,
          );
          return;
        }

        const now = Date.now();
        await AsyncStorage.setItem("last_sync_time", now.toString());
        const visibleCount = excludeSoftDeletedEntries(
          useAppStore.getState().entries,
        ).length;
        const failedAudioCount = useAppStore
          .getState()
          .entries.flatMap((e) => e.audios ?? [])
          .filter((a) => a.syncStatus === "failed").length;
        const baseMsg =
          type === "upload"
            ? i18n.t("upload.success", { ns: "sync", count: visibleCount })
            : i18n.t("pull.success", { ns: "sync", count: visibleCount });
        // Success flash: idle + non-empty syncProgress → CheckCircle ~2s (D-15)
        flashSyncProgress(
          useAppStore.setState.bind(useAppStore),
          {
            syncStatus: "idle",
            lastSyncTime: now,
            syncProgress:
              failedAudioCount > 0
                ? `${baseMsg} ${i18n.t("sync.audioUploadFailedSuffix", {
                    ns: "system",
                    count: failedAudioCount,
                  })}`
                : baseMsg,
          },
          SYNC_FLASH_MS,
        );
      } catch (error: unknown) {
        logger.error("profileSync", "sync action failed", error);
        const err = error as { message?: string };
        const errorMessage =
          err?.message ||
          i18n.t("sync.operationFailed", { ns: "system" });
        flashSyncProgress(
          useAppStore.setState.bind(useAppStore),
          {
            syncStatus: "error",
            syncProgress: errorMessage,
          },
          3000,
        );
      } finally {
        setIsLoading(false);
        isSyncingRef.current = false;
      }
    },
    [syncToCloud, recoverFromCloud, user, state],
  );

  const handleSyncUpload = useCallback(() => {
    void runSyncAction("upload");
  }, [runSyncAction]);

  const handleSyncPull = useCallback(() => {
    if (!user) {
      state.setIsRegisterMode(false);
      state.setIsLoginModalOpen(true);
      return;
    }
    if (state.isSyncingRef.current) return;

    state.isSyncingRef.current = true;
    void countPullConflicts(supabase, () => useAppStore.getState())
      .then((result) => {
        state.isSyncingRef.current = false;
        presentMergeConfirm(
          mergeConfirmForCount(result),
          (action) => {
            if (action === "upload") void runSyncAction("upload");
            if (action === "download") void runSyncAction("download");
          },
          {
            alert: Alert.alert,
            t: (key, options) =>
              String(i18n.t(key as never, options as never)),
          },
        );
      })
      .catch((error: unknown) => {
        state.isSyncingRef.current = false;
        const message =
          error instanceof Error
            ? error.message
            : i18n.t("sync.operationFailed", { ns: "system" });
        flashSyncProgress(
          useAppStore.setState.bind(useAppStore),
          { syncStatus: "error", syncProgress: message },
          3000,
        );
      });
  }, [runSyncAction, state, user]);

  const formatLastSyncTime = useCallback(
    (timestamp: number | null) =>
      formatLastSyncTimeValue(timestamp, effectiveLocale),
    [effectiveLocale],
  );

  return {
    handleSyncUpload,
    handleSyncPull,
    formatLastSyncTime,
    storeSyncStatus,
  };
}
