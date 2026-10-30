import AsyncStorage from "@react-native-async-storage/async-storage";
import { confirmAlert } from "@/utils/confirmAlert";

export const REVIEW_EXPORT_PRIVACY_ACK_KEY = "review_export_privacy_ack_v1";

export type PrivacyAckCopy = {
  title: string;
  message: string;
  continueLabel: string;
  /** Optional; confirmAlert defaults to common cancel when omitted. */
  cancelLabel?: string;
};

/**
 * Shows privacy confirm on first save; skips when AsyncStorage ack exists (D-15).
 * Cancel never acks (PRIM-03 / D-13). onConfirm(setAck) — setAck true when user confirms.
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

  const confirmed = await confirmAlert({
    title: alertCopy.title,
    message: alertCopy.message,
    confirmLabel: alertCopy.continueLabel,
    cancelLabel: alertCopy.cancelLabel,
  });

  if (confirmed) {
    await onConfirm(true);
  }
}

export async function persistPrivacyAck(): Promise<void> {
  await AsyncStorage.setItem(REVIEW_EXPORT_PRIVACY_ACK_KEY, "true");
}
