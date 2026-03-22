/**
 * Profile 同步流程：syncToCloud、recoverFromCloud、isSyncingRef 防抖
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { MutableRefObject } from "react";
import type { SyncStatus } from "./useProfileScreenState";

type StateRef = {
  isSyncingRef: MutableRefObject<boolean>;
  setIsLoading: (v: boolean) => void;
  setSyncStatus: (v: SyncStatus) => void;
  setSyncProgress: (v: string) => void;
  setLastSyncTime: (v: number) => void;
  /** 未登录时点击备份/恢复：打开登录弹窗（与头像区「点击登录」一致） */
  setIsLoginModalOpen: (v: boolean) => void;
  setIsRegisterMode: (v: boolean) => void;
};

export function useProfileSyncHandlers(state: StateRef) {
  const syncToCloud = useAppStore((s) => s.syncToCloud);
  const recoverFromCloud = useAppStore((s) => s.recoverFromCloud);
  const user = useAppStore((s) => s.user);

  const handleSyncAction = useCallback(
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
        type === "upload" ? "正在备份到云端..." : "正在从云端同步...",
      );

      try {
        if (type === "upload") {
          await syncToCloud();
          const now = Date.now();
          state.setLastSyncTime(now);
          await AsyncStorage.setItem("last_sync_time", now.toString());
          const currentEntries = useAppStore.getState().entries;
          setSyncStatus("success");
          setSyncProgress(`成功备份 ${currentEntries.length} 条记录`);
          setTimeout(() => {
            setSyncStatus("idle");
            setSyncProgress("");
          }, 2000);
        } else {
          await recoverFromCloud();
          const now = Date.now();
          state.setLastSyncTime(now);
          await AsyncStorage.setItem("last_sync_time", now.toString());
          const currentEntries = useAppStore.getState().entries;
          setSyncStatus("success");
          setSyncProgress(`成功同步 ${currentEntries.length} 条记录`);
          setTimeout(() => {
            setSyncStatus("idle");
            setSyncProgress("");
          }, 2000);
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        const errorMessage = err?.message || "操作失败，请稍后重试";
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

  const formatLastSyncTime = useCallback((timestamp: number | null) => {
    if (!timestamp) return "从未同步";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚同步";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }, []);

  return { handleSyncAction, formatLastSyncTime };
}
