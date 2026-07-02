import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const REVIEW_EXPORT_PRIVACY_ACK_KEY = "review_export_privacy_ack_v1";

export type PrivacyAckCopy = {
  title: string;
  message: string;
  continueLabel: string;
};

/**
 * Shows privacy Alert on first save; skips when AsyncStorage ack exists (D-15).
 * onConfirm(setAck) — setAck true when user confirms and ack should be persisted.
 */
export async function ensurePrivacyAck(
  onConfirm: (setAck: boolean) => void | Promise<void>,
  alertCopy: PrivacyAckCopy,
): Promise<void> {
  const ack = await AsyncStorage.getItem(REVIEW_EXPORT_PRIVACY_ACK_KEY);
  if (ack === "true") {
    await onConfirm(false);
    return;
  }

  Alert.alert(alertCopy.title, alertCopy.message, [
    {
      text: alertCopy.continueLabel,
      onPress: () => {
        void onConfirm(true);
      },
    },
  ]);
}

export async function persistPrivacyAck(): Promise<void> {
  await AsyncStorage.setItem(REVIEW_EXPORT_PRIVACY_ACK_KEY, "true");
}
