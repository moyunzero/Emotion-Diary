/**
 * REL-02 — formatRecentActivityLabel (Person Timeline latest metric)
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("formatRecentActivityLabel", () => {
  const EM_DASH = "—";
  const now = new Date(2026, 5, 19, 12, 0, 0); // 2026-06-19 local

  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("returns emDash unchanged for null timestamp", async () => {
    const { formatRecentActivityLabel } = await import(
      "@/shared/formatting/recentActivity"
    );
    expect(formatRecentActivityLabel(null, now, "zh-Hans", EM_DASH)).toBe(
      EM_DASH,
    );
  });

  it("uses relative labels for local diffDays 0, 1, and 6", async () => {
    const { i18n } = await import("@/i18n");
    const { formatRecentActivityLabel } = await import(
      "@/shared/formatting/recentActivity"
    );
    await i18n.changeLanguage("zh-Hans");

    const today = new Date(2026, 5, 19, 8, 0, 0).getTime();
    const yesterday = new Date(2026, 5, 18, 20, 0, 0).getTime();
    const sixDaysAgo = new Date(2026, 5, 13, 10, 0, 0).getTime();

    expect(formatRecentActivityLabel(today, now, "zh-Hans", EM_DASH)).toMatch(
      /今天/,
    );
    expect(
      formatRecentActivityLabel(yesterday, now, "zh-Hans", EM_DASH),
    ).toMatch(/昨天/);
    expect(
      formatRecentActivityLabel(sixDaysAgo, now, "zh-Hans", EM_DASH),
    ).toMatch(/6.*天前|天前/);
  });

  it("formats local diffDays ≥ 7 as zh month-day with 月 and 日", async () => {
    const { formatRecentActivityLabel } = await import(
      "@/shared/formatting/recentActivity"
    );
    const sevenDaysAgo = new Date(2026, 5, 12, 15, 0, 0).getTime();
    const label = formatRecentActivityLabel(
      sevenDaysAgo,
      now,
      "zh-Hans",
      EM_DASH,
    );
    expect(label).toMatch(/月/);
    expect(label).toMatch(/日/);
    expect(label).not.toMatch(/^\d+$/);
    expect(label).not.toBe(String(sevenDaysAgo));
  });

  it("never returns a raw epoch number string", async () => {
    const { formatRecentActivityLabel } = await import(
      "@/shared/formatting/recentActivity"
    );
    const ts = new Date(2026, 5, 1, 9, 0, 0).getTime();
    const label = formatRecentActivityLabel(ts, now, "zh-Hans", EM_DASH);
    expect(label).not.toBe(String(ts));
    expect(label).not.toMatch(/^\d{10,}$/);
  });
});
