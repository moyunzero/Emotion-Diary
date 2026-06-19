/**
 * I18N-06: initI18n 单例与 i18n.t() 冒烟
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "en-US" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("initI18n", () => {
  beforeEach(async () => {
    jest.resetModules();
  });

  it("initializes with system en device and returns appName string", async () => {
    const { initI18n, i18n } = await import("@/i18n");
    await initI18n();
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.language).toBe("en-US");
    expect(i18n.t("appName")).toBe("MoodMO");
  });

  it("resolves profile namespace keys after init", async () => {
    const { initI18n, i18n } = await import("@/i18n");
    await initI18n();
    const sectionTitle = i18n.t("language.sectionTitle", { ns: "profile" });
    expect(sectionTitle).toBeTruthy();
    expect(typeof sectionTitle).toBe("string");
    expect(sectionTitle.length).toBeGreaterThan(0);
  });

  it("respects manual zh-Hans over en device tag", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage"))
      .default;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ mode: "manual", locale: "zh-Hans" }),
    );

    jest.resetModules();
    jest.doMock("expo-localization", () => ({
      getLocales: jest.fn(() => [{ languageTag: "en-US" }]),
    }));
    jest.doMock("@react-native-async-storage/async-storage", () => ({
      getItem: jest.fn().mockResolvedValue(
        JSON.stringify({ mode: "manual", locale: "zh-Hans" }),
      ),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }));

    const { initI18n, i18n } = await import("@/i18n");
    await initI18n();
    expect(i18n.language).toBe("zh-Hans");
    expect(i18n.t("appName")).toBe("心晴MO");
  });

  it("resolves tabs namespace after language change", async () => {
    const { initI18n, i18n } = await import("@/i18n");
    await initI18n();
    await i18n.changeLanguage("en-US");
    expect(i18n.t("index", { ns: "tabs" })).toBe("Weather");
    await i18n.changeLanguage("zh-Hans");
    expect(i18n.t("index", { ns: "tabs" })).toBe("气象站");
  });
});
