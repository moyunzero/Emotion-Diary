/**
 * INS-05 — review export copy gate
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("review export copy via i18n", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("presets bilingual", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("presets.this_month", { ns: "review" })).toMatch(/month/i);
  });

  it("canvas rateLabel en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("canvas.rateLabel", { ns: "review" }).length).toBeGreaterThan(0);
  });
});
