/**
 * Profile 同步流程：syncToCloud、recoverFromCloud；与 store.syncStatus 对齐
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";
import { Alert } from "react-native";
import { i18n } from "@/i18n";
import { excludeSoftDeletedEntries } from "@/shared/entries/visibility";
import { useAppStore } from "@/store/useAppStore";
import { formatLastSyncTimeValue } from "../utils/formatLastSyncTime";
import type { MutableRefObject } from "react";
import type { ProfileSyncChrome } from "./useProfileScreenState";

type StateRef = {
  isSyncingRef: MutableRefObject<boolean>;
  setIsLoading: (v: boolean) => void;
  setProfileSyncChrome: (v: ProfileSyncChrome) => void;
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
  const effectiveLocale = useAppStore((s) => s.effectiveLocale);

  const runSyncAction = useCallback(
    async (type: "upload" | "download") => {
      if (!user) {
        state.setIsRegisterMode(false);
        state.setIsLoginModalOpen(true);
        return;
      }

      const { isSyncingRef, setIsLoading, setProfileSyncChrome, setSyncProgress } =
        state;
      if (isSyncingRef.current) return;

      isSyncingRef.current = true;
      setIsLoading(true);
      setProfileSyncChrome("syncing");
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
            setProfileSyncChrome("syncing");
            setSyncProgress(i18n.t("pendingMessage", { ns: "sync" }));
            setTimeout(() => {
              setProfileSyncChrome("idle");
              setSyncProgress("");
            }, 2500);
            return;
          }
          if (status === "error") {
            setProfileSyncChrome("error");
            setSyncProgress(i18n.t("notLoggedIn", { ns: "sync" }));
            setTimeout(() => {
              setProfileSyncChrome("idle");
              setSyncProgress("");
            }, 3000);
            return;
          }
          setProfileSyncChrome("error");
          setSyncProgress(
            i18n.t("sync.operationIncomplete", { ns: "system" }),
          );
          setTimeout(() => {
            setProfileSyncChrome("idle");
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
        setProfileSyncChrome("success");
        const baseMsg =
          type === "upload"
            ? i18n.t("upload.success", { ns: "sync", count: visibleCount })
            : i18n.t("pull.success", { ns: "sync", count: visibleCount });
        setSyncProgress(
          failedAudioCount > 0
            ? `${baseMsg} ${i18n.t("sync.audioUploadFailedSuffix", {
                ns: "system",
                count: failedAudioCount,
              })}`
            : baseMsg,
        );
        useAppStore.setState({ syncStatus: "idle" });
        setTimeout(() => {
          setProfileSyncChrome("idle");
          setSyncProgress("");
        }, 2000);
      } catch (error: unknown) {
        const err = error as { message?: string };
        const errorMessage =
          err?.message ||
          i18n.t("sync.operationFailed", { ns: "system" });
        setProfileSyncChrome("error");
        setSyncProgress(errorMessage);
        setTimeout(() => {
          setProfileSyncChrome("idle");
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
