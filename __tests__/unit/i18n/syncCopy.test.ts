/**
 * sync namespace — migrated from constants/syncDataOps.ts
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("sync copy via i18n", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("upload title differs from pull title in zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("uploadTitle", { ns: "sync" })).not.toBe(
      i18n.t("pullTitle", { ns: "sync" }),
    );
  });

  it("status.syncing resolves to former Chinese label", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("status.syncing", { ns: "sync" })).toBe("正在同步…");
  });

  it("status.pending resolves to former Chinese label", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("status.pending", { ns: "sync" })).toBe("同步排队中…");
  });

  it("status.error resolves to former Chinese label", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("status.error", { ns: "sync" })).toBe(
      "上次同步失败，请重试",
    );
  });

  it("upload.success interpolates count", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("upload.success", { ns: "sync", count: 3 })).toBe(
      "已备份 3 条记录到云端",
    );
  });

  it("pull.success interpolates count", async () => {
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("pull.success", { ns: "sync", count: 5 })).toBe(
      "已合并 5 条记录",
    );
  });
});
