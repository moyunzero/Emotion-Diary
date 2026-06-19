/**
 * I18N-01: mapDeviceLocale 设备 languageTag 映射
 */

import { mapDeviceLocale } from "@/i18n/mapDeviceLocale";

describe("mapDeviceLocale", () => {
  it.each([
    ["zh-CN", "zh-Hans"],
    ["zh-Hans", "zh-Hans"],
    ["zh-Hant", "zh-Hans"],
    ["zh-TW", "zh-Hans"],
    ["en-US", "en-US"],
    ["en-GB", "en-US"],
    ["ja-JP", "zh-Hans"],
    ["fr-FR", "zh-Hans"],
    ["", "zh-Hans"],
    ["  ", "zh-Hans"],
  ] as const)("maps %s → %s", (tag, expected) => {
    expect(mapDeviceLocale(tag)).toBe(expected);
  });
});
