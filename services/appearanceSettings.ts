/**
 * 外观偏好持久化（设备级，guest 与登录用户共用）
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ColorSchemeName } from "react-native";

const STORAGE_KEY = "app_appearance_settings_v1";

export type AppearanceMode = "system" | "light" | "night";

export type AppearancePreference = {
  mode: AppearanceMode;
};

export type ResolvedScheme = "light" | "night";

export const DEFAULT_APPEARANCE_PREFERENCE: AppearancePreference = {
  mode: "system",
};

function isAppearanceMode(value: unknown): value is AppearanceMode {
  return value === "system" || value === "light" || value === "night";
}

function parseAppearancePreference(raw: unknown): AppearancePreference {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_APPEARANCE_PREFERENCE };
  }

  const parsed = raw as Partial<AppearancePreference>;

  if (!isAppearanceMode(parsed.mode)) {
    return { ...DEFAULT_APPEARANCE_PREFERENCE };
  }

  return { mode: parsed.mode };
}

export function resolveEffectiveColorScheme(
  preference: AppearancePreference,
  systemColorScheme: ColorSchemeName | null | undefined,
): ResolvedScheme {
  if (preference.mode === "light") {
    return "light";
  }
  if (preference.mode === "night") {
    return "night";
  }
  return systemColorScheme === "dark" ? "night" : "light";
}

export async function loadAppearancePreference(): Promise<AppearancePreference> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_APPEARANCE_PREFERENCE };
    }
    return parseAppearancePreference(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_APPEARANCE_PREFERENCE };
  }
}

export async function saveAppearancePreference(
  preference: AppearancePreference,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
}
