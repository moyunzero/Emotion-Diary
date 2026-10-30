/**
 * AppButton contract helpers — Jest-safe (no JSX / RN StyleSheet).
 * UI lives in AppButton.tsx; tests load this module under node env.
 */

export const APP_BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "text",
  "danger",
] as const;

export type AppButtonVariant = (typeof APP_BUTTON_VARIANTS)[number];

export function resolveAppButtonDisabledReason(s: {
  disabled: boolean;
  disabledReason?: string;
}): string | null {
  if (!s.disabled) return null;
  return s.disabledReason?.trim() ? s.disabledReason : null;
}

export function isAppButtonPressLocked(s: {
  loading: boolean;
  disabled: boolean;
}): boolean {
  return s.loading || s.disabled;
}
