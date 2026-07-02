/**
 * SHR-05 — share namespace copy gate
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
}));

describe("share copy via i18n", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("watermark.brand exists in zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("watermark.brand", { ns: "share" })).toMatch(/心晴MO/);
  });

  it("watermark.brand exists in en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("watermark.brand", { ns: "share" })).toMatch(/MoodMO/i);
  });

  it("watermark.brand zh and en are non-empty and distinct", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    const zh = i18n.t("watermark.brand", { ns: "share" });
    await i18n.changeLanguage("en-US");
    const en = i18n.t("watermark.brand", { ns: "share" });
    expect(zh.length).toBeGreaterThan(0);
    expect(en.length).toBeGreaterThan(0);
    expect(zh).not.toBe(en);
  });

  it("canvas.periodTitle exists in zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(
      i18n.t("canvas.periodTitle", { ns: "share", period: "本周" }),
    ).toMatch(/关系天气/);
  });

  it("canvas.periodTitle exists in en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(
      i18n.t("canvas.periodTitle", { ns: "share", period: "This week" }),
    ).toMatch(/relationship weather/i);
  });
});
