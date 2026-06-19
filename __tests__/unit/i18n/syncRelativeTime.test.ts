/**
 * FMT-02 — formatLastSyncTime relative buckets + locale-aware long-range dates
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("formatLastSyncTime", () => {
  const fixedNow = new Date("2026-06-19T12:00:00").getTime();

  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  beforeEach(async () => {
    jest.spyOn(Date, "now").mockReturnValue(fixedNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns neverSynced when timestamp is null", async () => {
    const { formatLastSyncTimeValue } = await import(
      "@/features/profile/utils/formatLastSyncTime"
    );
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");

    expect(formatLastSyncTimeValue(null, "zh-Hans", fixedNow)).toBe(
      i18n.t("neverSynced", { ns: "sync" }),
    );
  });

  it("returns justSynced when less than one minute ago", async () => {
    const { formatLastSyncTimeValue } = await import(
      "@/features/profile/utils/formatLastSyncTime"
    );
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");

    expect(
      formatLastSyncTimeValue(fixedNow - 30_000, "zh-Hans", fixedNow),
    ).toBe(i18n.t("justSynced", { ns: "sync" }));
  });

  it("uses zh relative minutes bucket", async () => {
    const { formatLastSyncTimeValue } = await import(
      "@/features/profile/utils/formatLastSyncTime"
    );
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("zh-Hans");

    const result = formatLastSyncTimeValue(
      fixedNow - 5 * 60_000,
      "zh-Hans",
      fixedNow,
    );
    expect(result).toMatch(/分钟/);
    expect(result).toBe(
      i18n.t("relative.minutesAgo", { ns: "sync", count: 5 }),
    );
  });

  it("uses en relative minutes bucket", async () => {
    const { formatLastSyncTimeValue } = await import(
      "@/features/profile/utils/formatLastSyncTime"
    );
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");

    const result = formatLastSyncTimeValue(
      fixedNow - 5 * 60_000,
      "en-US",
      fixedNow,
    );
    expect(result).toMatch(/minute/i);
    expect(result).toBe(
      i18n.t("relative.minutesAgo", { ns: "sync", count: 5 }),
    );
  });

  it("uses formatLocaleDate short for sync older than 7 days", async () => {
    const { formatLastSyncTimeValue } = await import(
      "@/features/profile/utils/formatLastSyncTime"
    );
    const { formatLocaleDate } = await import("@/shared/formatting/date");
    const { i18n } = await import("@/i18n");
    await i18n.changeLanguage("en-US");

    const tenDaysAgo = fixedNow - 10 * 24 * 60 * 60_000;
    expect(formatLastSyncTimeValue(tenDaysAgo, "en-US", fixedNow)).toBe(
      formatLocaleDate(tenDaysAgo, "en-US", "short"),
    );
  });
});
