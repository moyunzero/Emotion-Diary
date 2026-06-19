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

  it("canvas footerBrand en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("canvas.footerBrand", { ns: "review" })).toMatch(/MoodMO|心晴/i);
  });

  it("a11y exportRange en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    const label = i18n.t("a11y.exportRange", {
      ns: "review",
      start: "Jun 1",
      end: "Jun 19",
    });
    expect(label).toMatch(/Review period/i);
    expect(label).toMatch(/Jun 1/);
  });
});
