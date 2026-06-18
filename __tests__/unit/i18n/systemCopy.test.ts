/**
 * SYS-03 / SYS-04 — locked system + record trust-surface copy
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("system trust copy", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("record.toasts.submitSuccess locked zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("toasts.submitSuccess", { ns: "record" })).toBe(
      "记录成功！已保存到你的情绪日记 💫",
    );
  });

  it("record.toasts.submitSuccess locked en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("toasts.submitSuccess", { ns: "record" })).toMatch(/Saved!/i);
  });

  it("system.audio.permission.title locked zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("audio.permission.title", { ns: "system" })).toBe(
      "需要录音权限",
    );
  });

  it("system.audio.permission.title locked en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("audio.permission.title", { ns: "system" })).toMatch(
      /Microphone/i,
    );
  });

  it("system.sync.operationIncomplete locked zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("sync.operationIncomplete", { ns: "system" })).toBe(
      "操作未完成，请稍后重试",
    );
  });

  it("system.sync.operationIncomplete locked en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("sync.operationIncomplete", { ns: "system" })).toContain(
      "incomplete",
    );
  });

  it("system.alerts.podcastGenerateFailed.title locked zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("alerts.podcastGenerateFailed.title", { ns: "system" })).toBe(
      "生成失败",
    );
  });

  it("system.alerts.podcastGenerateFailed.title locked en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("alerts.podcastGenerateFailed.title", { ns: "system" })).toMatch(
      /failed/i,
    );
  });
});
