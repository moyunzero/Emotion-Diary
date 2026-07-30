import type { StoreSyncStatus } from "@/store/modules/types";

export type SyncChromeIcon = "spinner" | "error" | "success" | "none";

export type SyncChromeTextLabels = {
  syncing: string;
  pending: string;
  error: string;
};

/** Success flash duration — idle + non-empty syncProgress → CheckCircle ~2s (D-15 / D-10). */
export const SYNC_FLASH_MS = 2000;

/** Mirrors 08-UI-SPEC.md §statusRow icon mapping. */
export function mapSyncChromeIcon(
  status: StoreSyncStatus,
  progress: string,
): SyncChromeIcon {
  if (status === "syncing" || status === "pending") return "spinner";
  if (status === "error") return "error";
  if (status === "idle" && progress !== "") return "success";
  return "none";
}

/**
 * statusText priority: progress → syncing → pending → error → lastSyncLabel.
 * Accepts pre-resolved label strings (no i18n import).
 */
export function mapSyncChromeText(
  status: StoreSyncStatus,
  progress: string,
  labels: SyncChromeTextLabels,
  lastSyncLabel: string,
): string {
  if (progress) return progress;
  if (status === "syncing") return labels.syncing;
  if (status === "pending") return labels.pending;
  if (status === "error") return labels.error;
  return lastSyncLabel;
}

/** WR-01: disable upload/download while syncing or loading. */
export function isSyncActionDisabled(
  status: StoreSyncStatus,
  isLoading: boolean,
): boolean {
  return isLoading || status === "syncing" || status === "pending";
}

type SyncProgressPatch = { syncProgress: string } & Record<string, unknown>;

/**
 * Injectable flash seam (D-17): apply patch then clear syncProgress after ms.
 * Defaults ms to SYNC_FLASH_MS for the success flash path.
 */
export function flashSyncProgress(
  apply: (patch: SyncProgressPatch) => void,
  patch: SyncProgressPatch,
  ms: number = SYNC_FLASH_MS,
): void {
  apply(patch);
  setTimeout(() => {
    apply({ syncProgress: "" });
  }, ms);
}
