/**
 * Appearance Zustand slice — 运行时主题与持久化（设备级）
 */

import { Appearance, type ColorSchemeName } from "react-native";

import {
  DEFAULT_APPEARANCE_PREFERENCE,
  loadAppearancePreference,
  resolveEffectiveColorScheme,
  saveAppearancePreference,
  type AppearanceMode,
  type AppearancePreference,
  type ResolvedScheme,
} from "../../services/appearanceSettings";
import { logger } from "../../utils/logger";
import { ModuleCreator, AppearanceModule } from "./types";

function systemSchemeNow(): ColorSchemeName | null | undefined {
  return Appearance.getColorScheme();
}

function effectiveFromPreference(
  preference: AppearancePreference,
): ResolvedScheme {
  return resolveEffectiveColorScheme(preference, systemSchemeNow());
}

export const createAppearanceModule: ModuleCreator<AppearanceModule> = (
  set,
  get,
) => ({
  appearancePreference: { ...DEFAULT_APPEARANCE_PREFERENCE },
  effectiveColorScheme: "light",

  _hydrateAppearance: (preference, effectiveColorScheme): void => {
    set({ appearancePreference: preference, effectiveColorScheme });
  },

  setAppearanceScheme: (scheme: ResolvedScheme): void => {
    if (get().appearancePreference.mode !== "system") {
      return;
    }
    set({ effectiveColorScheme: scheme });
  },

  setAppearanceMode: async (mode: AppearanceMode): Promise<void> => {
    const preference: AppearancePreference = { mode };

    try {
      await saveAppearancePreference(preference);
    } catch (error) {
      logger.error("AppearanceModule", "保存外观偏好失败", error);
    }

    const effectiveColorScheme = effectiveFromPreference(preference);
    set({ appearancePreference: preference, effectiveColorScheme });
  },
});

/** 启动时从 AsyncStorage 预读偏好（供 RootLayout 外层或测试使用） */
export async function prefetchAppearancePreference(): Promise<AppearancePreference> {
  return loadAppearancePreference();
}
