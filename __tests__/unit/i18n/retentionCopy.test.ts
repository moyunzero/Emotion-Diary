/**
 * RET-02/03 — retention namespace copy gate
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
}));

describe("retention copy via i18n", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("revisitBanner.subtitle.bloom zh matches garden tone", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("revisitBanner.subtitle.bloom", { ns: "retention" })).toMatch(
      /花园|花/,
    );
  });

  it("revisitBanner.subtitle.bloom en matches garden tone", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(
      i18n.t("revisitBanner.subtitle.bloom", { ns: "retention" }),
    ).toMatch(/garden|bloom/i);
  });

  it("revisitBanner.subtitle seed zh/en non-empty and distinct", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    const zh = i18n.t("revisitBanner.subtitle.seed", { ns: "retention" });
    await i18n.changeLanguage("en-US");
    const en = i18n.t("revisitBanner.subtitle.seed", { ns: "retention" });
    expect(zh.length).toBeGreaterThan(0);
    expect(en.length).toBeGreaterThan(0);
    expect(zh).not.toBe(en);
  });

  it("weeklyBanner.body bridges share card zh", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("weeklyBanner.body", { ns: "retention" })).toMatch(
      /回顾|卡|相册/,
    );
  });

  it("weeklyBanner.body bridges share card en", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("weeklyBanner.body", { ns: "retention" })).toMatch(
      /card|review|album/i,
    );
  });

  it("daily and weekly notification bodies differ and are non-empty", async () => {
    const { i18n } = await import("@/i18n");
    for (const lang of ["zh-Hans", "en-US"] as const) {
      await i18n.changeLanguage(lang);
      const daily = i18n.t("dailyNotification.body", { ns: "retention" });
      const weekly = i18n.t("weeklyNotification.body", { ns: "retention" });
      expect(daily.length).toBeGreaterThan(0);
      expect(weekly.length).toBeGreaterThan(0);
      expect(daily).not.toBe(weekly);
    }
  });

  it("dailyReminder.subtextDisabled mentions default off zh/en", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("dailyReminder.subtextDisabled", { ns: "retention" })).toMatch(
      /默认关闭|不含日记/,
    );
    await i18n.changeLanguage("en-US");
    expect(
      i18n.t("dailyReminder.subtextDisabled", { ns: "retention" }),
    ).toMatch(/off by default|no diary/i);
  });

  it("weeklyReview.toggleSubtext aligns with weekly review metaphor", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("weeklyReview.toggleSubtext", { ns: "retention" })).toMatch(
      /回顾|卡/,
    );
    await i18n.changeLanguage("en-US");
    expect(i18n.t("weeklyReview.toggleSubtext", { ns: "retention" })).toMatch(
      /review|card/i,
    );
  });
});
