/**
 * Unit tests for sync request merging with debounce logic
 * Tests Requirement 8.4 - Task 14.2
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

describe("Sync Request Merging with Debounce", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should debounce pending sync requests", async () => {
    // This test verifies that the processPendingSync function
    // uses debounce logic to merge rapid sync triggers.
    // Use fake timers for deterministic timing.
    jest.useFakeTimers();

    let isSyncing = false;
    let pendingSync = false;
    let syncCount = 0;
    let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const processPendingSync = (): void => {
      if (pendingSync && !isSyncing) {
        if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
        syncDebounceTimer = setTimeout(() => {
          if (pendingSync && !isSyncing) {
            pendingSync = false;
            void syncToCloud();
          }
          syncDebounceTimer = null;
        }, 300);
      }
    };

    const syncToCloud = (): Promise<boolean> =>
      new Promise((resolve) => {
        if (isSyncing) {
          pendingSync = true;
          resolve(false);
          return;
        }
        isSyncing = true;
        syncCount++;
        setTimeout(() => {
          isSyncing = false;
          resolve(true);
          setTimeout(() => processPendingSync(), 100);
        }, 50);
      });

    // Start first sync
    const firstSync = syncToCloud();

    // Advance 10ms and queue 3 rapid syncs (all will set pendingSync only)
    await jest.advanceTimersByTimeAsync(10);
    await syncToCloud();
    await jest.advanceTimersByTimeAsync(10);
    await syncToCloud();
    await jest.advanceTimersByTimeAsync(10);
    await syncToCloud();

    expect(pendingSync).toBe(true);

    // Complete first sync (50ms)
    await jest.advanceTimersByTimeAsync(50);
    await firstSync;

    // processPendingSync scheduled in finally at +100ms
    await jest.advanceTimersByTimeAsync(100);
    // Debounce timer 300ms
    await jest.advanceTimersByTimeAsync(300);
    // Debounced sync's internal 50ms
    await jest.advanceTimersByTimeAsync(50);

    expect(syncCount).toBe(2);
    expect(pendingSync).toBe(false);

    jest.useRealTimers();
  });

  it("should merge rapid triggers within debounce window", async () => {
    // This test verifies that multiple triggers within the debounce
    // window are merged into a single sync operation

    let isSyncing = false;
    let pendingSync = false;
    let syncCount = 0;
    let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const processPendingSync = async (): Promise<void> => {
      if (pendingSync && !isSyncing) {
        if (syncDebounceTimer) {
          clearTimeout(syncDebounceTimer);
        }

        syncDebounceTimer = setTimeout(async () => {
          if (pendingSync && !isSyncing) {
            pendingSync = false;
            await syncToCloud();
          }
          syncDebounceTimer = null;
        }, 300);
      }
    };

    const syncToCloud = async (): Promise<boolean> => {
      if (isSyncing) {
        pendingSync = true;
        return false;
      }

      isSyncing = true;
      syncCount++;

      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return true;
      } finally {
        isSyncing = false;
        setTimeout(() => processPendingSync(), 100);
      }
    };

    // Start first sync
    const firstSync = syncToCloud();

    // Trigger 10 rapid syncs while first is in progress
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      await syncToCloud();
    }

    // Wait for first sync to complete
    await firstSync;

    // Wait for debounce to complete
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Should have at most 2-3 actual syncs for 10 triggers
    expect(syncCount).toBeLessThanOrEqual(3);
  });

  it("should reset debounce timer on new pending sync requests", async () => {
    // This test verifies that the debounce timer is reset
    // when new sync requests come in during the debounce period

    let isSyncing = false;
    let pendingSync = false;
    let syncCount = 0;
    let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const processPendingSync = async (): Promise<void> => {
      if (pendingSync && !isSyncing) {
        if (syncDebounceTimer) {
          clearTimeout(syncDebounceTimer);
        }

        syncDebounceTimer = setTimeout(async () => {
          if (pendingSync && !isSyncing) {
            pendingSync = false;
            await syncToCloud();
          }
          syncDebounceTimer = null;
        }, 300);
      }
    };

    const syncToCloud = async (): Promise<boolean> => {
      if (isSyncing) {
        pendingSync = true;
        return false;
      }

      isSyncing = true;
      syncCount++;

      try {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return true;
      } finally {
        isSyncing = false;
        setTimeout(() => processPendingSync(), 100);
      }
    };

    // Start first sync
    const firstSync = syncToCloud();

    // Queue sync 1
    await new Promise((resolve) => setTimeout(resolve, 10));
    await syncToCloud();

    // Wait for first sync to complete and debounce to start
    await firstSync;
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Queue sync 2 (should reset debounce timer)
    await syncToCloud();

    // Wait for debounce to complete
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Should have 2 syncs total (initial + 1 debounced that merged both queued requests)
    expect(syncCount).toBe(2);
  });

  it("should clean up debounce timer properly", () => {
    // This test verifies that the debounce timer is cleaned up
    // when the cleanup function is called

    let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanupStoreTimers = (): void => {
      if (syncDebounceTimer) {
        clearTimeout(syncDebounceTimer);
        syncDebounceTimer = null;
      }
    };

    // Create a debounce timer
    syncDebounceTimer = setTimeout(() => {
      console.log("This should not execute");
    }, 300);

    expect(syncDebounceTimer).not.toBeNull();

    // Clean up
    cleanupStoreTimers();

    expect(syncDebounceTimer).toBeNull();
  });

  it("should handle concurrent sync and debounce correctly", async () => {
    // This test verifies that the system handles the case where
    // a sync completes while the debounce timer is active

    let isSyncing = false;
    let pendingSync = false;
    let syncCount = 0;
    let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const processPendingSync = async (): Promise<void> => {
      if (pendingSync && !isSyncing) {
        if (syncDebounceTimer) {
          clearTimeout(syncDebounceTimer);
        }

        syncDebounceTimer = setTimeout(async () => {
          if (pendingSync && !isSyncing) {
            pendingSync = false;
            await syncToCloud();
          }
          syncDebounceTimer = null;
        }, 300);
      }
    };

    const syncToCloud = async (): Promise<boolean> => {
      if (isSyncing) {
        pendingSync = true;
        return false;
      }

      isSyncing = true;
      syncCount++;

      try {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return true;
      } finally {
        isSyncing = false;
        setTimeout(() => processPendingSync(), 100);
      }
    };

    // Start first sync
    const firstSync = syncToCloud();

    // Queue sync while first is in progress
    await new Promise((resolve) => setTimeout(resolve, 10));
    await syncToCloud();

    // Wait for first sync to complete
    await firstSync;

    // Debounce timer should be active now
    expect(pendingSync).toBe(true);

    // Wait for debounce to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Pending sync should have been processed
    expect(syncCount).toBe(2);
    expect(pendingSync).toBe(false);
  });
});
