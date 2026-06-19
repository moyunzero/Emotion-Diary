/**
 * QA-02 — EmotionPodcast chrome copy gate
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("podcast.ui copy via i18n", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("en-US title is not hardcoded CJK", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    // @ts-expect-error podcast.ui keys land in GREEN
    const title = i18n.t("podcast.ui.title", { ns: "ai" });
    expect(title).not.toBe("情绪播客");
    expect(title).not.toMatch(/^podcast\.ui\./);
    expect(title).toMatch(/podcast|mood/i);
  });

  it("zh-Hans title is 情绪播客", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    // @ts-expect-error podcast.ui keys land in GREEN
    expect(i18n.t("podcast.ui.title", { ns: "ai" })).toBe("情绪播客");
  });

  it("periodWeek localized per locale", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    // @ts-expect-error podcast.ui keys land in GREEN
    expect(i18n.t("podcast.ui.periodWeek", { ns: "ai" })).toMatch(/week/i);
    await i18n.changeLanguage("zh-Hans");
    // @ts-expect-error podcast.ui keys land in GREEN
    expect(i18n.t("podcast.ui.periodWeek", { ns: "ai" })).toBe("本周");
  });
});
