/**
 * NIGHT-01 Wave 0 — appearanceSettings persist/parse (RED until Plan 02).
 * Mirrors localeSettings.test.ts contract (D-01, D-04).
 * Runtime require so missing module fails the suite (not TS2307).
 */

/// <reference path="../../typings/phase26-wave0-red.d.ts" />

import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

type AppearanceModule = typeof import("@/services/appearanceSettings");

function loadAppearanceSettings(): AppearanceModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/services/appearanceSettings") as AppearanceModule;
}

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("appearanceSettings (NIGHT-01)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns default when storage is empty", async () => {
    const {
      DEFAULT_APPEARANCE_PREFERENCE,
      loadAppearancePreference,
    } = loadAppearanceSettings();
    mockStorage.getItem.mockResolvedValueOnce(null);
    await expect(loadAppearancePreference()).resolves.toEqual(
      DEFAULT_APPEARANCE_PREFERENCE,
    );
    expect(DEFAULT_APPEARANCE_PREFERENCE).toEqual({ mode: "system" });
  });

  it("returns default on invalid JSON", async () => {
    const {
      DEFAULT_APPEARANCE_PREFERENCE,
      loadAppearancePreference,
    } = loadAppearanceSettings();
    mockStorage.getItem.mockResolvedValueOnce("not-json{{{");
    await expect(loadAppearancePreference()).resolves.toEqual(
      DEFAULT_APPEARANCE_PREFERENCE,
    );
  });

  it("downgrades manual without explicit scheme to system", async () => {
    const { loadAppearancePreference } = loadAppearanceSettings();
    mockStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ mode: "manual" }),
    );
    await expect(loadAppearancePreference()).resolves.toEqual({ mode: "system" });
  });

  it("round-trips valid night preference", async () => {
    const { loadAppearancePreference, saveAppearancePreference } =
      loadAppearanceSettings();
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
