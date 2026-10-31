/**
 * NIGHT-01 Wave 0 — appearanceSettings persist/parse (RED until Plan 02).
 * Mirrors localeSettings.test.ts contract (D-01, D-04).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_APPEARANCE_PREFERENCE,
  loadAppearancePreference,
  saveAppearancePreference,
} from "@/services/appearanceSettings";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("appearanceSettings (NIGHT-01)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns default when storage is empty", async () => {
    mockStorage.getItem.mockResolvedValueOnce(null);
    await expect(loadAppearancePreference()).resolves.toEqual(
      DEFAULT_APPEARANCE_PREFERENCE,
    );
    expect(DEFAULT_APPEARANCE_PREFERENCE).toEqual({ mode: "system" });
  });

  it("returns default on invalid JSON", async () => {
    mockStorage.getItem.mockResolvedValueOnce("not-json{{{");
    await expect(loadAppearancePreference()).resolves.toEqual(
      DEFAULT_APPEARANCE_PREFERENCE,
    );
  });

  it("downgrades manual without explicit scheme to system", async () => {
    mockStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ mode: "manual" }),
    );
    await expect(loadAppearancePreference()).resolves.toEqual({ mode: "system" });
  });

  it("round-trips valid night preference", async () => {
    const preference = { mode: "night" as const };
    mockStorage.getItem.mockResolvedValueOnce(JSON.stringify(preference));
    await expect(loadAppearancePreference()).resolves.toEqual(preference);
    await saveAppearancePreference(preference);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "app_appearance_settings_v1",
      JSON.stringify(preference),
    );
  });
});
