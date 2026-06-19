/**
 * REC-01–REC-06 — locked core recording loop copy
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("recording loop copy via i18n", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("mood level labels zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("level.1.label", { ns: "mood" })).toBe("委屈");
    expect(i18n.t("level.5.label", { ns: "mood" })).toBe("爆发");
    expect(i18n.t("deadline.today.label", { ns: "mood" })).toBe("今天谈");
  });

  it("mood level labels en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("level.1.label", { ns: "mood" })).toBe("Hurt");
    expect(i18n.t("level.5.label", { ns: "mood" })).toBe("Storm");
    expect(i18n.t("deadline.today.label", { ns: "mood" })).toBe("Talk today");
  });

  it("deadline labels resolve legacy zh/en stored values", async () => {
    const { i18n } = await import("@/i18n");
    const { getDeadlineLabel } = await import("@/i18n/moodLabels");
    await i18n.changeLanguage("en-US");
    expect(getDeadlineLabel("今天谈")).toBe("Talk today");
    expect(getDeadlineLabel("Talk today")).toBe("Talk today");
    await i18n.changeLanguage("zh-Hans");
    expect(getDeadlineLabel("Talk today")).toBe("今天谈");
    expect(getDeadlineLabel("today")).toBe("今天谈");
  });

  it("record screen title locked copy", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("screen.title", { ns: "record" })).toBe("记录这一刻");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("screen.title", { ns: "record" })).toBe("Capture this moment");
  });

  it("dashboard filter and alerts", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("filter.all", { ns: "dashboard" })).toBe("全部记录");
    expect(i18n.t("alerts.burn.title", { ns: "dashboard" })).toBe("气话焚烧");
    await i18n.changeLanguage("en-US");
    expect(i18n.t("filter.all", { ns: "dashboard" })).toBe("All entries");
    expect(i18n.t("alerts.burn.title", { ns: "dashboard" })).toBe("Burn it out");
  });
});
