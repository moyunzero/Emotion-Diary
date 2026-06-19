/**
 * I18N-03: localeSettings AsyncStorage 持久化与解析降级
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_LOCALE_PREFERENCE,
  loadLocalePreference,
  saveLocalePreference,
} from "@/services/localeSettings";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("localeSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns default when storage is empty", async () => {
    mockStorage.getItem.mockResolvedValueOnce(null);
    await expect(loadLocalePreference()).resolves.toEqual(
      DEFAULT_LOCALE_PREFERENCE,
    );
  });

  it("returns default on invalid JSON", async () => {
    mockStorage.getItem.mockResolvedValueOnce("not-json{{{");
    await expect(loadLocalePreference()).resolves.toEqual(
      DEFAULT_LOCALE_PREFERENCE,
    );
  });

  it("downgrades manual without locale to system", async () => {
    mockStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ mode: "manual" }),
    );
    await expect(loadLocalePreference()).resolves.toEqual({ mode: "system" });
  });

  it("round-trips valid manual en-US preference", async () => {
    const preference = { mode: "manual" as const, locale: "en-US" as const };
    mockStorage.getItem.mockResolvedValueOnce(JSON.stringify(preference));
    await expect(loadLocalePreference()).resolves.toEqual(preference);
    await saveLocalePreference(preference);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "app_locale_settings_v1",
      JSON.stringify(preference),
    );
  });
});
