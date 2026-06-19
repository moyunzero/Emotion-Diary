/**
 * NAT-01 — iOS native permission string parity gate (en/zh static JSON)
 */

import enNative from "@/locales/native/en.json";
import zhNative from "@/locales/native/zh.json";

const REQUIRED_IOS_KEYS = [
  "NSMicrophoneUsageDescription",
  "NSPhotoLibraryUsageDescription",
  "NSPhotoLibraryAddUsageDescription",
  "NSFaceIDUsageDescription",
] as const;

function getIosBlock(locale: { ios?: Record<string, string> }): Record<string, string> {
  return locale.ios ?? (locale as Record<string, string>);
}

describe("native iOS locale permission strings (NAT-01)", () => {
  const enIos = getIosBlock(enNative);
  const zhIos = getIosBlock(zhNative);

  it("en and zh define identical NS* key sets", () => {
    const enKeys = REQUIRED_IOS_KEYS.filter((key) => enIos[key] !== undefined).sort();
    const zhKeys = REQUIRED_IOS_KEYS.filter((key) => zhIos[key] !== undefined).sort();
    expect(enKeys).toEqual([...REQUIRED_IOS_KEYS].sort());
    expect(zhKeys).toEqual([...REQUIRED_IOS_KEYS].sort());
    expect(Object.keys(enIos).sort()).toEqual(Object.keys(zhIos).sort());
  });

  it("en native locale defines all permission keys with English copy", () => {
    for (const key of REQUIRED_IOS_KEYS) {
      const value = enIos[key];
      expect(value).toBeDefined();
      expect(value.trim()).not.toBe("");
      expect(value).toMatch(/[A-Za-z]/);
      expect(value).toMatch(/Mood Diary|microphone|photo|Face ID|voice|Save/i);
    }
  });

  it("zh native locale defines all permission keys with 心晴MO and CJK text", () => {
    for (const key of REQUIRED_IOS_KEYS) {
      const value = zhIos[key];
      expect(value).toBeDefined();
      expect(value.trim()).not.toBe("");
      expect(value).toContain("心晴MO");
      expect(value).toMatch(/[\u4e00-\u9fff]/);
    }
  });
});
