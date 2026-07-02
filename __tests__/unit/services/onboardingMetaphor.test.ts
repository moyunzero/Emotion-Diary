/**
 * ONB-05: onboardingMetaphor seen flag persistence + upgrade migration (D-11)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadFromStorage } from "@/store/modules/storage";
import {
  ONBOARDING_METAPHOR_SEEN_KEY,
  loadOnboardingMetaphorSeen,
  migrateOnboardingMetaphorIfNeeded,
  setOnboardingMetaphorSeen,
} from "@/services/onboardingMetaphor";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  getAllKeys: jest.fn(),
}));

jest.mock("@/store/modules/storage", () => ({
  loadFromStorage: jest.fn(),
}));

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockLoadFromStorage = loadFromStorage as jest.MockedFunction<
  typeof loadFromStorage
>;

describe("onboardingMetaphor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getAllKeys.mockResolvedValue([]);
    mockLoadFromStorage.mockResolvedValue([]);
  });

  describe("loadOnboardingMetaphorSeen / setOnboardingMetaphorSeen", () => {
    it("returns false when storage is empty", async () => {
      mockStorage.getItem.mockResolvedValueOnce(null);
      await expect(loadOnboardingMetaphorSeen()).resolves.toBe(false);
    });

    it("round-trips seen=true via set then load", async () => {
      mockStorage.getItem.mockResolvedValueOnce("true");
      await expect(loadOnboardingMetaphorSeen()).resolves.toBe(true);

      await setOnboardingMetaphorSeen(true);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_METAPHOR_SEEN_KEY,
        "true",
      );
    });
  });

  describe("migrateOnboardingMetaphorIfNeeded", () => {
    function mockSeenFlag(raw: string | null) {
      mockStorage.getItem.mockImplementation(async (key: string) => {
        if (key === ONBOARDING_METAPHOR_SEEN_KEY) {
          return raw;
        }
        return null;
      });
    }

    it("sets seen when user_session is present", async () => {
      mockSeenFlag(null);
      mockStorage.getItem.mockImplementation(async (key: string) => {
        if (key === ONBOARDING_METAPHOR_SEEN_KEY) {
          return null;
        }
        if (key === "user_session") {
          return JSON.stringify({ id: "user-1" });
        }
        return null;
      });

      await migrateOnboardingMetaphorIfNeeded();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_METAPHOR_SEEN_KEY,
        "true",
      );
      expect(mockLoadFromStorage).not.toHaveBeenCalled();
    });

    it("sets seen when legacy mood_entries has items", async () => {
      mockSeenFlag(null);
      mockLoadFromStorage.mockImplementation(async (key: string) => {
        if (key === "mood_entries") {
          return [{ id: "e1" }] as never;
        }
        return [];
      });

      await migrateOnboardingMetaphorIfNeeded();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_METAPHOR_SEEN_KEY,
        "true",
      );
    });

    it("sets seen when mood_entries_guest has items", async () => {
      mockSeenFlag(null);
      mockLoadFromStorage.mockImplementation(async (key: string) => {
        if (key === "mood_entries") {
          return [];
        }
        if (key === "mood_entries_guest") {
          return [{ id: "guest-1" }] as never;
        }
        return [];
      });

      await migrateOnboardingMetaphorIfNeeded();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_METAPHOR_SEEN_KEY,
        "true",
      );
    });

    it("sets seen when dynamic mood_entries_{userId} has items", async () => {
      mockSeenFlag(null);
      mockStorage.getAllKeys.mockResolvedValue([
        "mood_entries_user123",
        "onboarding_metaphor_v1_seen",
      ]);
      mockLoadFromStorage.mockImplementation(async (key: string) => {
        if (key === "mood_entries_user123") {
          return [{ id: "u1" }] as never;
        }
        return [];
      });

      await migrateOnboardingMetaphorIfNeeded();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_METAPHOR_SEEN_KEY,
        "true",
      );
    });

    it("short-circuits when already seen", async () => {
      mockSeenFlag("true");

      await migrateOnboardingMetaphorIfNeeded();

      expect(mockStorage.setItem).not.toHaveBeenCalled();
      expect(mockLoadFromStorage).not.toHaveBeenCalled();
    });

    it("second migrate call is idempotent after first migration", async () => {
      mockSeenFlag(null);
      mockStorage.getItem.mockImplementation(async (key: string) => {
        if (key === ONBOARDING_METAPHOR_SEEN_KEY) {
          return null;
        }
        if (key === "user_session") {
          return JSON.stringify({ id: "user-1" });
        }
        return null;
      });

      await migrateOnboardingMetaphorIfNeeded();
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);

      mockStorage.setItem.mockClear();
      mockStorage.getItem.mockImplementation(async (key: string) => {
        if (key === ONBOARDING_METAPHOR_SEEN_KEY) {
          return "true";
        }
        return null;
      });

      await migrateOnboardingMetaphorIfNeeded();
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
