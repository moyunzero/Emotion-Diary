/**
 * Wave 0 Nyquist RED — type-only stubs until Plan 02 implements modules.
 * Jest still fails at runtime until services/appearanceSettings.ts exists.
 */
declare module "@/services/appearanceSettings" {
  export type AppearanceMode = "system" | "light" | "night";

  export type AppearancePreference = {
    mode: AppearanceMode;
  };

  export const DEFAULT_APPEARANCE_PREFERENCE: AppearancePreference;

  export function loadAppearancePreference(): Promise<AppearancePreference>;

  export function saveAppearancePreference(
    preference: AppearancePreference,
  ): Promise<void>;
}
