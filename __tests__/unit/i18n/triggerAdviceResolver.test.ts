/**
 * INS-02 — resolveTriggerAdvice preset key, legacy zh, and other fallback
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { TRIGGER_KEYS } from "@/constants";

describe("resolveTriggerAdvice", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("resolves preset key work in zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    const { resolveTriggerAdvice } = await import("@/i18n/resolvePresetLabel");
    await i18n.changeLanguage("zh-Hans");
    expect(resolveTriggerAdvice("work")).toBe(
      "给自己的花园放个假吧，休息也是成长的一部分",
    );
  });

  it("resolves preset key work in en-US with garden metaphor", async () => {
    const { i18n } = await import("@/i18n");
    const { resolveTriggerAdvice } = await import("@/i18n/resolvePresetLabel");
    await i18n.changeLanguage("en-US");
    expect(resolveTriggerAdvice("work")).toMatch(/garden/i);
  });

  it("maps legacy zh 工作 to same advice as work", async () => {
    const { i18n } = await import("@/i18n");
    const { resolveTriggerAdvice } = await import("@/i18n/resolvePresetLabel");
    await i18n.changeLanguage("zh-Hans");
    expect(resolveTriggerAdvice("工作")).toBe(resolveTriggerAdvice("work"));
  });

  it("falls back to other advice for unknown custom triggers", async () => {
    const { i18n } = await import("@/i18n");
    const { resolveTriggerAdvice } = await import("@/i18n/resolvePresetLabel");
    await i18n.changeLanguage("zh-Hans");
    expect(resolveTriggerAdvice("random-custom")).toBe(
      resolveTriggerAdvice("other"),
    );
    await i18n.changeLanguage("en-US");
    expect(resolveTriggerAdvice("random-custom")).toBe(
      resolveTriggerAdvice("other"),
    );
  });

  it("has matching insights.triggers.advice leaves for all TRIGGER_KEYS", async () => {
    const { i18n } = await import("@/i18n");
    const { resolveTriggerAdvice } = await import("@/i18n/resolvePresetLabel");
    for (const key of TRIGGER_KEYS) {
      await i18n.changeLanguage("zh-Hans");
      const zhAdvice = resolveTriggerAdvice(key);
      expect(zhAdvice.length).toBeGreaterThan(0);
      await i18n.changeLanguage("en-US");
      const enAdvice = resolveTriggerAdvice(key);
      expect(enAdvice.length).toBeGreaterThan(0);
      expect(enAdvice).not.toBe(zhAdvice);
    }
  });
});

describe("resolveTriggerAdviceShort", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  it("resolves shorter preset advice for work in zh-Hans", async () => {
    const { i18n } = await import("@/i18n");
    const { resolveTriggerAdvice, resolveTriggerAdviceShort } = await import(
      "@/i18n/resolvePresetLabel"
    );
    await i18n.changeLanguage("zh-Hans");
    const full = resolveTriggerAdvice("work");
    const short = resolveTriggerAdviceShort("work");
    expect(short).toBe("给花园放个假");
    expect(short.length).toBeLessThan(full.length);
  });

  it("falls back to other short advice for unknown triggers", async () => {
    const { i18n } = await import("@/i18n");
    const { resolveTriggerAdviceShort } = await import("@/i18n/resolvePresetLabel");
    await i18n.changeLanguage("en-US");
    expect(resolveTriggerAdviceShort("custom-x")).toBe(
      resolveTriggerAdviceShort("other"),
    );
  });

  it("has matching adviceShort leaves for all TRIGGER_KEYS", async () => {
    const { i18n } = await import("@/i18n");
    const { resolveTriggerAdviceShort } = await import("@/i18n/resolvePresetLabel");
    for (const key of TRIGGER_KEYS) {
      await i18n.changeLanguage("zh-Hans");
      expect(resolveTriggerAdviceShort(key).length).toBeGreaterThan(0);
      await i18n.changeLanguage("en-US");
      expect(resolveTriggerAdviceShort(key).length).toBeGreaterThan(0);
    }
  });
});
