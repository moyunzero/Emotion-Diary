import type { AppLocale } from "./mapDeviceLocale";
import { mapDeviceLocale } from "./mapDeviceLocale";
import type { LocalePreference } from "../services/localeSettings";

function isAppLocale(value: unknown): value is AppLocale {
  return value === "zh-Hans" || value === "en-US";
}

/**
 * 合并持久化偏好与设备 languageTag，得到冷启动 effective locale。
 */
export function resolveInitialLocale(
  preference: LocalePreference,
  deviceLanguageTag: string,
): AppLocale {
  if (
    preference.mode === "manual" &&
    preference.locale &&
    isAppLocale(preference.locale)
  ) {
    return preference.locale;
  }
  return mapDeviceLocale(deviceLanguageTag);
}
