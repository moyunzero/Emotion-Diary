/**
 * Profile 同步流程：syncToCloud、recoverFromCloud；与 store.syncStatus 对齐
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";
import { Alert } from "react-native";
import { i18n } from "@/i18n";
import { excludeSoftDeletedEntries } from "@/shared/entries/visibility";
import { useAppStore } from "@/store/useAppStore";
import type { MutableRefObject } from "react";
import type { SyncStatus } from "./useProfileScreenState";

type StateRef = {
  isSyncingRef: MutableRefObject<boolean>;
  setIsLoading: (v: boolean) => void;
  setSyncStatus: (v: SyncStatus) => void;
  setSyncProgress: (v: string) => void;
  setLastSyncTime: (v: number) => void;
  setIsLoginModalOpen: (v: boolean) => void;
  setIsRegisterMode: (v: boolean) => void;
};

export function useProfileSyncHandlers(state: StateRef) {
  const syncToCloud = useAppStore((s) => s.syncToCloud);
  const recoverFromCloud = useAppStore((s) => s.recoverFromCloud);
  const storeSyncStatus = useAppStore((s) => s.syncStatus);
  const user = useAppStore((s) => s.user);

  const runSyncAction = useCallback(
    async (type: "upload" | "download") => {
      if (!user) {
        state.setIsRegisterMode(false);
        state.setIsLoginModalOpen(true);
        return;
      }

      const { isSyncingRef, setIsLoading, setSyncStatus, setSyncProgress } =
        state;
      if (isSyncingRef.current) return;

      isSyncingRef.current = true;
      setIsLoading(true);
      setSyncStatus("syncing");
      setSyncProgress(
        type === "upload"
          ? i18n.t("upload.progress", { ns: "sync" })
          : i18n.t("pull.progress", { ns: "sync" }),
      );

      try {
        const ok =
          type === "upload"
            ? await syncToCloud()
            : await recoverFromCloud();

        if (!ok) {
          const status = useAppStore.getState().syncStatus;
          if (status === "pending") {
            setSyncStatus("syncing");
            setSyncProgress(i18n.t("pendingMessage", { ns: "sync" }));
            setTimeout(() => {
              setSyncStatus("idle");
              setSyncProgress("");
            }, 2500);
            return;
          }
          if (status === "error") {
            setSyncStatus("error");
            setSyncProgress(i18n.t("notLoggedIn", { ns: "sync" }));
            setTimeout(() => {
              setSyncStatus("idle");
              setSyncProgress("");
            }, 3000);
            return;
          }
          setSyncStatus("error");
          setSyncProgress(
            i18n.t("sync.operationIncomplete", { ns: "system" }),
          );
          setTimeout(() => {
            setSyncStatus("idle");
            setSyncProgress("");
          }, 3000);
          return;
        }

        const now = Date.now();
        state.setLastSyncTime(now);
        await AsyncStorage.setItem("last_sync_time", now.toString());
        const visibleCount = excludeSoftDeletedEntries(
          useAppStore.getState().entries,
        ).length;
        const failedAudioCount = useAppStore
          .getState()
          .entries.flatMap((e) => e.audios ?? [])
          .filter((a) => a.syncStatus === "failed").length;
        setSyncStatus("success");
        const baseMsg =
          type === "upload"
            ? i18n.t("upload.success", { ns: "sync", count: visibleCount })
            : i18n.t("pull.success", { ns: "sync", count: visibleCount });
        setSyncProgress(
          failedAudioCount > 0
            ? `${baseMsg}；${i18n.t("sync.audioUploadFailedSuffix", {
                ns: "system",
                count: failedAudioCount,
              })}`
            : baseMsg,
        );
        useAppStore.setState({ syncStatus: "idle" });
        setTimeout(() => {
          setSyncStatus("idle");
          setSyncProgress("");
        }, 2000);
      } catch (error: unknown) {
        const err = error as { message?: string };
        const errorMessage =
          err?.message ||
          i18n.t("sync.operationFailed", { ns: "system" });
        setSyncStatus("error");
        setSyncProgress(errorMessage);
        setTimeout(() => {
          setSyncStatus("idle");
          setSyncProgress("");
        }, 3000);
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
    Alert.alert(
      i18n.t("pull.confirmTitle", { ns: "sync" }),
      i18n.t("pull.confirmMessage", { ns: "sync" }),
      [
        {
          text: i18n.t("actions.cancel", { ns: "common" }),
          style: "cancel",
        },
        {
          text: i18n.t("pull.confirmOk", { ns: "sync" }),
          onPress: () => void runSyncAction("download"),
        },
      ],
    );
  }, [runSyncAction]);

  const formatLastSyncTime = useCallback((timestamp: number | null) => {
    if (!timestamp) return i18n.t("neverSynced", { ns: "sync" });
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return i18n.t("justSynced", { ns: "sync" });
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }, []);

  return {
    handleSyncUpload,
    handleSyncPull,
    formatLastSyncTime,
    storeSyncStatus,
  };
}
