/**
 * I18N-02, D-31 — system vs manual mode foreground locale refresh
 */

const mockChangeAppLanguage = jest.fn().mockResolvedValue(undefined);
const mockReschedule = jest.fn().mockResolvedValue(undefined);

jest.mock("@/i18n", () => ({
  changeAppLanguage: (...args: unknown[]) => mockChangeAppLanguage(...args),
}));

jest.mock("@/services/emotionReminders", () => ({
  rescheduleEmotionRemindersFromStorage: (...args: unknown[]) =>
    mockReschedule(...args),
}));

import { refreshSystemLocaleIfNeeded } from "@/store/refreshSystemLocaleIfNeeded";

describe("refreshSystemLocaleIfNeeded", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refreshes when system mode and mapped locale differs", async () => {
    const onLocaleUpdated = jest.fn();
    const result = await refreshSystemLocaleIfNeeded(
      { mode: "system" },
      "zh-Hans",
      "en-GB",
      onLocaleUpdated,
    );

    expect(result).toEqual({ refreshed: true, newLocale: "en-US" });
    expect(mockChangeAppLanguage).toHaveBeenCalledWith("en-US");
    expect(onLocaleUpdated).toHaveBeenCalledWith("en-US");
    expect(mockReschedule).toHaveBeenCalledTimes(1);
  });

  it("skips when manual mode", async () => {
    const result = await refreshSystemLocaleIfNeeded(
      { mode: "manual", locale: "zh-Hans" },
      "zh-Hans",
      "en-GB",
    );

    expect(result).toEqual({ refreshed: false });
    expect(mockChangeAppLanguage).not.toHaveBeenCalled();
    expect(mockReschedule).not.toHaveBeenCalled();
  });

  it("skips when mapped locale matches effective locale", async () => {
    const result = await refreshSystemLocaleIfNeeded(
      { mode: "system" },
      "en-US",
      "en-GB",
    );

    expect(result).toEqual({ refreshed: false });
    expect(mockChangeAppLanguage).not.toHaveBeenCalled();
    expect(mockReschedule).not.toHaveBeenCalled();
  });
});
