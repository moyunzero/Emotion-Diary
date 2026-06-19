/**
 * REC-05 — preset label resolver + legacy zh fallback
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("resolvePresetLabel", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("resolves preset keys in zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    const { resolvePeopleLabel, resolveTriggerLabel } = await import(
      "@/i18n/resolvePresetLabel"
    );
    await i18n.changeLanguage("zh-Hans");
    expect(resolvePeopleLabel("boyfriend")).toBe("男朋友");
    expect(resolveTriggerLabel("work")).toBe("工作");
  });

  it("resolves preset keys in en-US", async () => {
    const { i18n } = await import("@/i18n");
    const { resolvePeopleLabel, resolveTriggerLabel } = await import(
      "@/i18n/resolvePresetLabel"
    );
    await i18n.changeLanguage("en-US");
    expect(resolvePeopleLabel("boyfriend")).toBe("Boyfriend");
    expect(resolveTriggerLabel("friends")).toBe("Friends");
  });

  it("maps legacy zh presets to localized labels", async () => {
    const { i18n } = await import("@/i18n");
    const { resolvePeopleLabel, resolveTriggerLabel } = await import(
      "@/i18n/resolvePresetLabel"
    );
    await i18n.changeLanguage("zh-Hans");
    expect(resolvePeopleLabel("男朋友")).toBe("男朋友");
    expect(resolveTriggerLabel("朋友")).toBe("朋友");
  });

  it("maps legacy en presets to localized labels in zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    const { resolvePeopleLabel, resolveTriggerLabel } = await import(
      "@/i18n/resolvePresetLabel"
    );
    await i18n.changeLanguage("zh-Hans");
    expect(resolvePeopleLabel("Other")).toBe("其他");
    expect(resolveTriggerLabel("Study")).toBe("学习");
    expect(resolveTriggerLabel("#Study")).toBe("#Study");
  });

  it("maps legacy zh presets to en-US labels", async () => {
    const { i18n } = await import("@/i18n");
    const { resolvePeopleLabel, resolveTriggerLabel } = await import(
      "@/i18n/resolvePresetLabel"
    );
    await i18n.changeLanguage("en-US");
    expect(resolvePeopleLabel("男朋友")).toBe("Boyfriend");
    expect(resolveTriggerLabel("学习")).toBe("Study");
  });

  it("disambiguates people vs trigger legacy 朋友", async () => {
    const { i18n } = await import("@/i18n");
    const { resolvePeopleLabel, resolveTriggerLabel } = await import(
      "@/i18n/resolvePresetLabel"
    );
    await i18n.changeLanguage("zh-Hans");
    expect(resolvePeopleLabel("朋友")).toBe("朋友");
    expect(resolveTriggerLabel("朋友")).toBe("朋友");
    await i18n.changeLanguage("en-US");
    expect(resolvePeopleLabel("朋友")).toBe("Friend");
    expect(resolveTriggerLabel("朋友")).toBe("Friends");
  });

  it("passes through custom user strings unchanged", async () => {
    const { resolvePeopleLabel } = await import("@/i18n/resolvePresetLabel");
    expect(resolvePeopleLabel("我的秘密")).toBe("我的秘密");
  });
});
