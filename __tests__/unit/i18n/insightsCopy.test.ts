/**
 * INS-01 / SYS-04 — locked insights + system copy smoke tests
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("insights and system copy", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("insights.header.title uses Mind Garden in en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("header.title", { ns: "insights" })).toMatch(/Mind Garden/i);
  });

  it("insights.header.title locked zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("header.title", { ns: "insights" })).toBe("我的心灵花园");
  });

  it("insights.triggers.advice.work locked zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("triggers.advice.work", { ns: "insights" })).toBe(
      "给自己的花园放个假吧，休息也是成长的一部分",
    );
  });

  it("insights.triggers.title uses Trigger insights in en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("triggers.title", { ns: "insights" })).toMatch(
      /Trigger insights/i,
    );
  });

  it("insights.prescription.generate locked en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("prescription.generate", { ns: "insights" })).toBe(
      "Get AI suggestions",
    );
  });

  it("insights.relationship.title locked zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("relationship.title", { ns: "insights" })).toBe("关系花园");
  });

  it("system.audio.permission.title locked zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("audio.permission.title", { ns: "system" })).toBe(
      "需要录音权限",
    );
  });

  it("system.sync.operationIncomplete supports interpolation context", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("sync.operationIncomplete", { ns: "system" })).toBe(
      "操作未完成，请稍后重试",
    );
    await i18n.changeLanguage("en-US");
    expect(i18n.t("sync.operationIncomplete", { ns: "system" })).toContain(
      "incomplete",
    );
  });

  it("system.sync.audioUploadFailedSuffix interpolates count", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(
      i18n.t("sync.audioUploadFailedSuffix", { ns: "system", count: 2 }),
    ).toContain("2");
  });

  it("dashboard.weatherStation.title non-empty in en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("weatherStation.title", { ns: "dashboard" }).length).toBeGreaterThan(0);
  });

  it("dashboard.weatherStation.dates.today is Today in en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("weatherStation.dates.today", { ns: "dashboard" })).toBe("Today");
  });

  it("dashboard.weatherStation.alerts.minEntries.title locked zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("weatherStation.alerts.minEntries.title", { ns: "dashboard" })).toBe(
      "提示",
    );
  });
});
