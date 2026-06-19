/**
 * QA-02 / D-126 — bilingual core-path copy smoke (record → dashboard → insights → export → sync → recycle)
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("bilingual end-to-end copy smoke", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("record → dashboard → insights → export → sync → recycle path keys en-US", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");

    expect(i18n.t("screen.title", { ns: "record" })).toBe("Capture this moment");
    expect(i18n.t("header.title", { ns: "dashboard" })).toBe("Emotion Weather Station");
    expect(i18n.t("filter.all", { ns: "dashboard" })).toBe("All entries");
    expect(i18n.t("header.title", { ns: "insights" })).toMatch(/Mind Garden/i);
    expect(i18n.t("podcast.ui.title", { ns: "ai" })).toMatch(/podcast|mood/i);
    expect(i18n.t("podcast.ui.periodWeek", { ns: "ai" })).toMatch(/week/i);
    expect(i18n.t("screen.title", { ns: "review" })).toBe("Mood Review");
    expect(i18n.t("presets.this_month", { ns: "review" })).toMatch(/month/i);
    expect(i18n.t("uploadTitle", { ns: "sync" })).toBe("Back up to cloud");
    expect(i18n.t("pullTitle", { ns: "sync" })).toBe("Merge from cloud");
    expect(i18n.t("recycleBin.title", { ns: "profile" })).toBe("Recycle bin");
    expect(i18n.t("restore.buttonLabel", { ns: "recycle" })).toBe("Restore");
    expect(i18n.t("purge.buttonLabel", { ns: "recycle" })).toBe("Delete forever");
    expect(i18n.t("emptyState.title", { ns: "recycle" })).toBe("Recycle bin is empty");
    expect(i18n.t("index", { ns: "tabs" })).toBe("Weather");
    expect(i18n.t("record", { ns: "tabs" })).toBe("Record");
    expect(i18n.t("insights", { ns: "tabs" })).toBe("Garden");
    expect(i18n.t("stats.entriesLabel", { ns: "profile" })).toBe("Mood entries");
    expect(i18n.t("stats.weatherScoreLabel", { ns: "profile" })).toBe("Mood index");
    expect(i18n.t("weatherStation.descriptions.stormy", { ns: "dashboard" })).toMatch(
      /care for yourself/i,
    );
    expect(i18n.t("utils.weekdays.1", { ns: "insights" })).toMatch(/mon/i);
  });

  it("same path keys zh-Hans locked", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");

    expect(i18n.t("screen.title", { ns: "record" })).toBe("记录这一刻");
    expect(i18n.t("header.title", { ns: "dashboard" })).toBe("情绪气象站");
    expect(i18n.t("filter.all", { ns: "dashboard" })).toBe("全部记录");
    expect(i18n.t("header.title", { ns: "insights" })).toBe("我的心灵花园");
    expect(i18n.t("podcast.ui.title", { ns: "ai" })).toBe("情绪播客");
    expect(i18n.t("podcast.ui.periodWeek", { ns: "ai" })).toBe("本周");
    expect(i18n.t("screen.title", { ns: "review" })).toBe("情绪回顾图");
    expect(i18n.t("presets.this_month", { ns: "review" })).toBe("本月");
    expect(i18n.t("uploadTitle", { ns: "sync" })).toBe("备份到云端");
    expect(i18n.t("pullTitle", { ns: "sync" })).toBe("从云端合并");
    expect(i18n.t("recycleBin.title", { ns: "profile" })).toBe("回收站");
    expect(i18n.t("restore.buttonLabel", { ns: "recycle" })).toBe("恢复");
    expect(i18n.t("purge.buttonLabel", { ns: "recycle" })).toBe("永久删除");
    expect(i18n.t("emptyState.title", { ns: "recycle" })).toBe("回收站是空的");
    expect(i18n.t("index", { ns: "tabs" })).toBe("气象站");
    expect(i18n.t("record", { ns: "tabs" })).toBe("记一笔");
    expect(i18n.t("insights", { ns: "tabs" })).toBe("花园");
    expect(i18n.t("stats.entriesLabel", { ns: "profile" })).toBe("心事记录");
    expect(i18n.t("stats.weatherScoreLabel", { ns: "profile" })).toBe("心情指数");
    expect(i18n.t("weatherStation.descriptions.stormy", { ns: "dashboard" })).toBe(
      "雷雨天，先照顾好自己，再慢慢沟通",
    );
    expect(i18n.t("utils.weekdays.1", { ns: "insights" })).toBe("周一");
  });
});
