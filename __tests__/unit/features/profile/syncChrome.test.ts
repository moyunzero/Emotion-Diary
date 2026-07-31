/**
 * features/profile/utils/syncChrome — Wave 0 stubs for TEST-03 (D-09..D-11, D-17).
 *
 * Expected exports (Plan 09-03):
 * - mapSyncChromeIcon
 * - mapSyncChromeText (or equivalent statusText helper)
 * - isSyncActionDisabled (optional WR-01)
 * - SYNC_FLASH_MS
 * - flashSyncProgress
 *
 * RED until Plan 09-03 lands the module; do not describe.skip.
 */

import type { StoreSyncStatus } from "@/store/modules/types";
import {
  SYNC_FLASH_MS,
  flashSyncProgress,
  mapSyncChromeIcon,
  mapSyncChromeText,
} from "@/features/profile/utils/syncChrome";

describe("mapSyncChromeIcon (D-11)", () => {
  it.each([
    ["syncing", "", "spinner"],
    ["pending", "", "spinner"],
    ["error", "", "error"],
    ["idle", "done", "success"],
    ["idle", "", "none"],
  ] as const)(
    "status=%s progress=%s → %s",
    (status, progress, expected) => {
      expect(mapSyncChromeIcon(status as StoreSyncStatus, progress)).toBe(
        expected,
      );
    },
  );
});

describe("mapSyncChromeText priority (D-09)", () => {
  const labels = {
    syncing: "syncing-label",
    pending: "pending-label",
    error: "error-label",
    lastSync: "last-sync-label",
  };

  it("prefers non-empty progress over status labels", () => {
    expect(
      mapSyncChromeText("idle", "uploading…", labels, labels.lastSync),
    ).toBe("uploading…");
  });

  it("uses syncing label when status is syncing and progress empty", () => {
    expect(mapSyncChromeText("syncing", "", labels, labels.lastSync)).toBe(
      labels.syncing,
    );
  });

  it("uses pending label when status is pending and progress empty", () => {
    expect(mapSyncChromeText("pending", "", labels, labels.lastSync)).toBe(
      labels.pending,
    );
  });

  it("uses error label when status is error and progress empty", () => {
    expect(mapSyncChromeText("error", "", labels, labels.lastSync)).toBe(
      labels.error,
    );
  });

  it("falls back to last-sync label when idle and progress empty", () => {
    expect(mapSyncChromeText("idle", "", labels, labels.lastSync)).toBe(
      labels.lastSync,
    );
  });
});

describe("flashSyncProgress (D-10 / D-17)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("clears progress after SYNC_FLASH_MS (~2000)", async () => {
    const apply = jest.fn();
    expect(SYNC_FLASH_MS).toBe(2000);

    flashSyncProgress(apply, { syncProgress: "ok" }, SYNC_FLASH_MS);
    expect(apply).toHaveBeenCalledWith({ syncProgress: "ok" });

    jest.advanceTimersByTime(SYNC_FLASH_MS - 1);
    await Promise.resolve();
    expect(apply).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(apply).toHaveBeenCalledWith({ syncProgress: "" });
    expect(apply).toHaveBeenCalledTimes(2);
  });
});
