/**
 * Locale Zustand slice — 运行时语言状态与持久化（设备级）
 */

import * as Localization from "expo-localization";

import { changeAppLanguage } from "../../i18n";
import { mapDeviceLocale, type AppLocale } from "../../i18n/mapDeviceLocale";
import { clearAiCache } from "../../utils/aiService";
import { logger } from "../../utils/logger";
import {
  DEFAULT_LOCALE_PREFERENCE,
  loadLocalePreference,
  saveLocalePreference,
  type LocaleMode,
  type LocalePreference,
} from "../../services/localeSettings";
import { rescheduleEmotionRemindersFromStorage } from "../../services/emotionReminders";
import { ModuleCreator, LocaleModule } from "./types";

function resolveEffectiveFromPreference(
  preference: LocalePreference,
): AppLocale {
  const deviceTag =
    Localization.getLocales()[0]?.languageTag ?? "zh-Hans";
  if (
    preference.mode === "manual" &&
    preference.locale &&
    (preference.locale === "zh-Hans" || preference.locale === "en-US")
  ) {
    return preference.locale;
  }
  return mapDeviceLocale(deviceTag);
}

export const createLocaleModule: ModuleCreator<LocaleModule> = (set, get) => ({
  localePreference: { ...DEFAULT_LOCALE_PREFERENCE },
  effectiveLocale: "zh-Hans",

  _hydrateLocale: (preference, effectiveLocale): void => {
    set({ localePreference: preference, effectiveLocale });
  },

  setLocaleMode: async (mode: LocaleMode): Promise<void> => {
    const current = get();
    let preference: LocalePreference;

    if (mode === "system") {
      preference = { mode: "system" };
    } else {
      preference = {
        mode: "manual",
        locale: current.effectiveLocale,
      };
    }

    try {
      await saveLocalePreference(preference);
    } catch (error) {
      logger.error("LocaleModule", "保存语言偏好失败", error);
    }

    const effectiveLocale = resolveEffectiveFromPreference(preference);
    await changeAppLanguage(effectiveLocale);
    clearAiCache();
    get().clearForecast?.();
    get().clearPodcast?.();
    set({ localePreference: preference, effectiveLocale });
    try {
      await rescheduleEmotionRemindersFromStorage();
    } catch (error) {
      logger.error("LocaleModule", "重调度情绪提醒失败", error);
    }
  },

  setLocale: async (locale: AppLocale): Promise<void> => {
    const preference: LocalePreference = { mode: "manual", locale };

    try {
      await saveLocalePreference(preference);
    } catch (error) {
      logger.error("LocaleModule", "保存语言偏好失败", error);
    }

    await changeAppLanguage(locale);
    clearAiCache();
    get().clearForecast?.();
    get().clearPodcast?.();
    set({ localePreference: preference, effectiveLocale: locale });
    try {
      await rescheduleEmotionRemindersFromStorage();
    } catch (error) {
      logger.error("LocaleModule", "重调度情绪提醒失败", error);
    }
  },
});

/** 启动时从 AsyncStorage 预读偏好（供 initI18n 外层或测试使用） */
export async function prefetchLocalePreference(): Promise<LocalePreference> {
  return loadLocalePreference();
}
