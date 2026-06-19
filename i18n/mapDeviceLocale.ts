/**
 * 设备 languageTag → 应用 BCP47 locale（纯函数，无 RN 依赖）
 */

export type AppLocale = "zh-Hans" | "en-US";

/**
 * 将 expo-localization 的 languageTag 映射为应用支持的 locale。
 * zh*（含 zh-Hant、zh-TW）→ zh-Hans；en* → en-US；其余 → zh-Hans。
 */
export function mapDeviceLocale(languageTag: string): AppLocale {
  const tag = languageTag.trim().toLowerCase();
  if (!tag) {
    return "zh-Hans";
  }
  if (tag.startsWith("zh")) {
    return "zh-Hans";
  }
  if (tag.startsWith("en")) {
    return "en-US";
  }
  return "zh-Hans";
}
