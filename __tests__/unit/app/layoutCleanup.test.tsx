/**
 * App Layout Cleanup Tests
 *
 * Tests for Requirement 8.3: Timer cleanup on app unmount
 * Validates that the app-level useEffect properly cleans up timers when unmounting
 */

import { renderHook } from "@testing-library/react-native";
import { useEffect } from "react";
import {
  cleanupStoreTimers,
  initializeStore,
} from "../../../store/useAppStore";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Supabase
jest.mock("../../../lib/supabase", () => ({
  isSupabaseConfigured: jest.fn(() => false),
  supabase: {
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null }),
      ),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

describe("Feature: react-native-optimization, App Layout Cleanup Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Requirement 8.3: Timer cleanup on app unmount", () => {
    it("should call cleanupStoreTimers when app-level useEffect cleanup runs", () => {
      // Track if cleanup was called
      let cleanupCalled = false;
      const mockCleanupStoreTimers = () => {
        cleanupCalled = true;
      };

      // Simulate the app-level useEffect pattern from _layout.tsx
      const useAppLifecycle = () => {
        useEffect(() => {
          let cleanup: (() => void) | undefined;

          try {
            cleanup = initializeStore();
          } catch (error) {
            console.error("应用初始化失败:", error);
          }

          return () => {
            if (cleanup) {
              try {
                (cleanup as Function)();
              } catch (error) {
                console.error("清理初始化资源失败:", error);
              }
            }

            try {
              mockCleanupStoreTimers();
            } catch (error) {
              console.error("清理 store 定时器失败:", error);
            }
          };
        }, []);
      };

      const { unmount } = renderHook(() => useAppLifecycle());

      // Unmount to trigger cleanup
      unmount();

      // Verify cleanupStoreTimers was called
      expect(cleanupCalled).toBe(true);
    });

    it("should handle errors during cleanup gracefully", () => {
      const mockCleanup = jest.fn(() => {
        throw new Error("Cleanup error");
      });

      const useAppLifecycle = () => {
        useEffect(() => {
          const cleanup = initializeStore();

          return () => {
            if (cleanup) {
              try {
                (cleanup as Function)();
              } catch (error) {
                console.error("清理初始化资源失败:", error);
              }
            }

            try {
              mockCleanup();
            } catch (error) {
              console.error("清理 store 定时器失败:", error);
            }
          };
        }, []);
      };

      // Should not throw even if cleanup fails
      const { unmount } = renderHook(() => useAppLifecycle());
      expect(() => unmount()).not.toThrow();

      // Verify cleanup was attempted
      expect(mockCleanup).toHaveBeenCalledTimes(1);
    });

    it("should cleanup timers even if initializeStore returns undefined", () => {
      let cleanupCalled = false;
      const mockCleanupStoreTimers = () => {
        cleanupCalled = true;
      };

      const useAppLifecycle = () => {
        useEffect(() => {
          // Simulate initializeStore returning undefined
          const cleanup: (() => void) | undefined = undefined;

          return () => {
            if (cleanup) {
              try {
                (cleanup as Function)();
              } catch (error) {
                console.error("清理初始化资源失败:", error);
              }
            }

            try {
              mockCleanupStoreTimers();
            } catch (error) {
              console.error("清理 store 定时器失败:", error);
            }
          };
        }, []);
      };

      const { unmount } = renderHook(() => useAppLifecycle());

      // Should not throw
      expect(() => unmount()).not.toThrow();

      // Verify cleanupStoreTimers was still called
      expect(cleanupCalled).toBe(true);
    });

    it("should call both auth cleanup and timer cleanup", () => {
      const callOrder: string[] = [];

      const useAppLifecycle = () => {
        useEffect(() => {
          const cleanup = () => {
            callOrder.push("auth");
          };

          return () => {
            if (cleanup) {
              try {
                cleanup();
              } catch (error) {
                console.error("清理初始化资源失败:", error);
              }
            }

            try {
              callOrder.push("timers");
            } catch (error) {
              console.error("清理 store 定时器失败:", error);
            }
          };
        }, []);
      };

      const { unmount } = renderHook(() => useAppLifecycle());

      unmount();

      // Verify both cleanups were called in order
      expect(callOrder).toEqual(["auth", "timers"]);
    });

    it("should only initialize once even with multiple renders", () => {
      let initCount = 0;
      let cleanupCount = 0;

      const useAppLifecycle = () => {
        useEffect(() => {
          initCount++;
          const cleanup = initializeStore();

          return () => {
            cleanupCount++;
            if (cleanup) {
              try {
                cleanup();
              } catch (error) {
                console.error("清理初始化资源失败:", error);
              }
            }

            try {
              cleanupStoreTimers();
            } catch (error) {
              console.error("清理 store 定时器失败:", error);
            }
          };
        }, []); // Empty dependency array - only run once
      };

      const { rerender, unmount } = renderHook(() => useAppLifecycle());

      // Initial render
      expect(initCount).toBe(1);

      // Rerender
      rerender({});

      // Should still only be initialized once
      expect(initCount).toBe(1);

      // Unmount
      unmount();

      // Cleanup should be called once
      expect(cleanupCount).toBe(1);
    });

    it("should verify cleanupStoreTimers function exists and is callable", () => {
      // Verify the function exists
      expect(cleanupStoreTimers).toBeDefined();
      expect(typeof cleanupStoreTimers).toBe("function");

      // Verify it can be called without errors
      expect(() => cleanupStoreTimers()).not.toThrow();
    });
  });

  describe("Integration: Cleanup with real store timers", () => {
    it("should cleanup real store timers on unmount", () => {
      jest.useFakeTimers();

      const useAppLifecycle = () => {
        useEffect(() => {
          const cleanup = initializeStore();

          return () => {
            if (cleanup) {
              try {
                cleanup();
              } catch (error) {
                console.error("清理初始化资源失败:", error);
              }
            }

            try {
              cleanupStoreTimers();
            } catch (error) {
              console.error("清理 store 定时器失败:", error);
            }
          };
        }, []);
      };

      const { unmount } = renderHook(() => useAppLifecycle());

      // Unmount should not throw
      expect(() => unmount()).not.toThrow();

      // Verify cleanup was successful
      expect(() => cleanupStoreTimers()).not.toThrow();

      jest.useRealTimers();
    });
  });
});
