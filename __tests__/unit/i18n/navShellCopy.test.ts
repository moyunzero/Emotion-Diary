/**
 * NAV-01, NAV-02, NAV-04 — locked navigation shell copy
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("navigation shell copy via i18n", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("tabs zh-Hans locked copy", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("index", { ns: "tabs" })).toBe("气象站");
    expect(i18n.t("record", { ns: "tabs" })).toBe("记一笔");
    expect(i18n.t("insights", { ns: "tabs" })).toBe("花园");
  });

  it("tabs en-US locked copy", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("index", { ns: "tabs" })).toBe("Weather");
    expect(i18n.t("record", { ns: "tabs" })).toBe("Record");
    expect(i18n.t("insights", { ns: "tabs" })).toBe("Garden");
  });

  it("profile.screen.title locked copy", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("screen.title", { ns: "profile" })).toBe("个人中心");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("screen.title", { ns: "profile" })).toBe("Profile");
  });

  it("review.screen.title locked copy", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("screen.title", { ns: "review" })).toBe("情绪回顾图");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("screen.title", { ns: "review" })).toBe("Mood Review");
  });

  it("recycle.screen.title unchanged regression", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("screen.title", { ns: "recycle" })).toBe("回收站");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("screen.title", { ns: "recycle" })).toBe("Recycle bin");
  });

  it("common.shell back and close non-empty both locales", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("shell.back")).toBe("返回");
    expect(i18n.t("shell.close")).toBe("关闭");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("shell.back")).toBe("Back");
    expect(i18n.t("shell.close")).toBe("Close");
  });
});
