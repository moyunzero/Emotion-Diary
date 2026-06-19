/**
 * D-31: 前台恢复时按系统语言刷新 effectiveLocale（纯决策 + 副作用编排）
 */

import { changeAppLanguage } from "../i18n";
import { mapDeviceLocale, type AppLocale } from "../i18n/mapDeviceLocale";
import { rescheduleEmotionRemindersFromStorage } from "../services/emotionReminders";
import type { LocalePreference } from "../services/localeSettings";

export type RefreshSystemLocaleResult = {
  refreshed: boolean;
  newLocale?: AppLocale;
};

export async function refreshSystemLocaleIfNeeded(
  preference: LocalePreference,
  effectiveLocale: AppLocale,
  deviceTag: string,
  onLocaleUpdated?: (locale: AppLocale) => void,
): Promise<RefreshSystemLocaleResult> {
  if (preference.mode !== "system") {
    return { refreshed: false };
  }

  const mapped = mapDeviceLocale(deviceTag);
  if (mapped === effectiveLocale) {
    return { refreshed: false };
  }

  await changeAppLanguage(mapped);
  onLocaleUpdated?.(mapped);
  await rescheduleEmotionRemindersFromStorage();
  return { refreshed: true, newLocale: mapped };
}
