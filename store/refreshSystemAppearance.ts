/**
 * D-01: 前台恢复时按系统外观刷新 effectiveColorScheme（纯决策 + 副作用编排）
 */

import { Appearance } from "react-native";

import {
  resolveEffectiveColorScheme,
  type AppearancePreference,
  type ResolvedScheme,
} from "../services/appearanceSettings";

export type RefreshSystemAppearanceResult = {
  refreshed: boolean;
  newScheme?: ResolvedScheme;
};

export async function refreshSystemAppearanceIfNeeded(
  preference: AppearancePreference,
  effectiveColorScheme: ResolvedScheme,
  onSchemeUpdated?: (scheme: ResolvedScheme) => void,
): Promise<RefreshSystemAppearanceResult> {
  if (preference.mode !== "system") {
    return { refreshed: false };
  }

  const resolved = resolveEffectiveColorScheme(
    preference,
    Appearance.getColorScheme(),
  );

  if (resolved === effectiveColorScheme) {
    return { refreshed: false };
  }

  onSchemeUpdated?.(resolved);
  return { refreshed: true, newScheme: resolved };
}
