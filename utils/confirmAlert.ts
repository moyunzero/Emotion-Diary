import { Alert } from "react-native";

export type ConfirmAlertOptions = {
  title: string;
  message?: string;
  confirmLabel: string;
  /** Defaults to "Cancel" when omitted; prefer passing localized copy at call sites. */
  cancelLabel?: string;
  destructive?: boolean;
};

/**
 * Cold confirmation via system Alert (PRIM-03 / D-13).
 * Always includes Cancel. Resolves true on confirm, false on cancel.
 * Must call Alert.alert so webAlertPolyfill remains valid (T-23-05).
 * No i18n import here — keeps Jest unit harnesses free of expo-localization ESM.
 */
export function confirmAlert(
  options: ConfirmAlertOptions,
): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel,
    cancelLabel = "Cancel",
    destructive = false,
  } = options;

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {
        text: cancelLabel,
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: confirmLabel,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}
