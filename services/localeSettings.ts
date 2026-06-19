/**
 * 语言偏好持久化（设备级，guest 与登录用户共用）
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppLocale } from "../i18n/mapDeviceLocale";

const STORAGE_KEY = "app_locale_settings_v1";

export type LocaleMode = "system" | "manual";

export type LocalePreference = {
  mode: LocaleMode;
  locale?: AppLocale;
};

export const DEFAULT_LOCALE_PREFERENCE: LocalePreference = {
  mode: "system",
};

function isLocaleMode(value: unknown): value is LocaleMode {
  return value === "system" || value === "manual";
}

function isAppLocale(value: unknown): value is AppLocale {
  return value === "zh-Hans" || value === "en-US";
}

function parseLocalePreference(raw: unknown): LocalePreference {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_LOCALE_PREFERENCE };
  }

  const parsed = raw as Partial<LocalePreference>;

  if (!isLocaleMode(parsed.mode)) {
    return { ...DEFAULT_LOCALE_PREFERENCE };
  }

  if (parsed.mode === "manual") {
    if (!parsed.locale || !isAppLocale(parsed.locale)) {
      return { mode: "system" };
    }
    return { mode: "manual", locale: parsed.locale };
  }

  return { mode: "system" };
}

export async function loadLocalePreference(): Promise<LocalePreference> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_LOCALE_PREFERENCE };
    }
    return parseLocalePreference(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_LOCALE_PREFERENCE };
  }
}

export async function saveLocalePreference(
  preference: LocalePreference,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
}
