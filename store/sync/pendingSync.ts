import {
  consumePendingSyncRequest,
  hasPendingSyncRequest,
  isSyncLockHeld,
} from "../../shared/sync/syncLock";

let syncDebounceTimerRef: ReturnType<typeof setTimeout> | null = null;

export const clearPendingSyncDebounce = (): void => {
  if (syncDebounceTimerRef) {
    clearTimeout(syncDebounceTimerRef);
    syncDebounceTimerRef = null;
  }
};

/**
 * Debounced pending sync scheduler — inject runSyncToCloud from facade (no useAppStore import).
 */
export function scheduleProcessPendingSync(
  runSyncToCloud: () => Promise<boolean | void>,
): void {
  if (hasPendingSyncRequest() && !isSyncLockHeld()) {
    if (syncDebounceTimerRef) {
      clearTimeout(syncDebounceTimerRef);
    }

    syncDebounceTimerRef = setTimeout(async () => {
      if (consumePendingSyncRequest() && !isSyncLockHeld()) {
        if (__DEV__) console.log("处理待处理的同步请求");
        await runSyncToCloud();
      }
      syncDebounceTimerRef = null;
    }, 300);
  }
}
