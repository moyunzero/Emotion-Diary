/**
 * SYS-05 — notification channel and schedule content use i18n.t at schedule time
 */

const mockSetNotificationChannelAsync = jest
  .fn()
  .mockResolvedValue(undefined);
const mockScheduleNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockCancelScheduledNotificationAsync = jest
  .fn()
  .mockResolvedValue(undefined);

jest.mock("expo-notifications", () => ({
  setNotificationChannelAsync: (...args: unknown[]) =>
    mockSetNotificationChannelAsync(...args),
  scheduleNotificationAsync: (...args: unknown[]) =>
    mockScheduleNotificationAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) =>
    mockCancelScheduledNotificationAsync(...args),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: "daily", WEEKLY: "weekly" },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

jest.mock("react-native", () => ({
  Platform: { OS: "android" },
}));

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "en-US" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("emotionReminders i18n at schedule time", () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    const { initI18n, i18n } = await import("@/i18n");
    await initI18n();
    await i18n.changeLanguage("en-US");
  });

  it("ensureAndroidNotificationChannel uses retention.androidChannelName", async () => {
    const { i18n } = await import("@/i18n");
    const { ensureAndroidNotificationChannel } = await import(
      "@/services/emotionReminders"
    );

    await ensureAndroidNotificationChannel();

    expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith(
      "emotion-reminders",
      expect.objectContaining({
        name: i18n.t("androidChannelName", { ns: "retention" }),
      }),
    );
    expect(mockSetNotificationChannelAsync.mock.calls[0][1].name).toBe(
      "Mood reminders",
    );
  });

  it("applyEmotionReminderSchedule uses i18n.t for notification title and body", async () => {
    const { i18n } = await import("@/i18n");
    const { applyEmotionReminderSchedule } = await import(
      "@/services/emotionReminders"
    );

    await applyEmotionReminderSchedule({
      dailyReminderEnabled: true,
      dailyReminderHour: 9,
      dailyReminderMinute: 30,
      weeklyReviewNotificationEnabled: true,
    });

    const dailyCall = mockScheduleNotificationAsync.mock.calls.find(
      (call) => call[0]?.identifier === "emotion-daily-reminder",
    );
    const weeklyCall = mockScheduleNotificationAsync.mock.calls.find(
      (call) => call[0]?.identifier === "emotion-weekly-review",
    );

    expect(dailyCall).toBeDefined();
    expect(dailyCall![0].content.title).toBe(
      i18n.t("dailyNotification.title", { ns: "retention" }),
    );
    expect(dailyCall![0].content.body).toBe(
      i18n.t("dailyNotification.body", { ns: "retention" }),
    );
    expect(weeklyCall).toBeDefined();
    expect(weeklyCall![0].content.title).toBe(
      i18n.t("weeklyNotification.title", { ns: "retention" }),
    );
    expect(weeklyCall![0].content.body).toBe(
      i18n.t("weeklyNotification.body", { ns: "retention" }),
    );

    expect(dailyCall![0].content.title).not.toBe("心晴MO");
    expect(dailyCall![0].content.body).not.toContain("今天过得怎样");
  });
});
