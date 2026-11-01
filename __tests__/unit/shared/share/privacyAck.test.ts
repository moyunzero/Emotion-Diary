jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockAlert = jest.fn();

jest.mock("react-native", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  REVIEW_EXPORT_PRIVACY_ACK_KEY,
  ensurePrivacyAck,
  type PrivacyAckCopy,
} from "@/shared/share/privacyAck";

const alertCopy: PrivacyAckCopy = {
  title: "Privacy",
  message: "Save to device",
  continueLabel: "Continue",
  cancelLabel: "Cancel",
};

type AlertButton = {
  text?: string;
  style?: string;
  onPress?: () => void;
};

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("privacyAck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("REVIEW_EXPORT_PRIVACY_ACK_KEY is review_export_privacy_ack_v1", () => {
    expect(REVIEW_EXPORT_PRIVACY_ACK_KEY).toBe("review_export_privacy_ack_v1");
  });

  it("ensurePrivacyAck skips Alert when AsyncStorage ack is true", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("true");
    const onConfirm = jest.fn();

    await ensurePrivacyAck(onConfirm, alertCopy);

    expect(mockAlert).not.toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it("ensurePrivacyAck shows cancel + continue; cancel does not ack", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const onConfirm = jest.fn();

    const pending = ensurePrivacyAck(onConfirm, alertCopy);
    await flushMicrotasks();

    expect(mockAlert).toHaveBeenCalled();
    const buttons = mockAlert.mock.calls[0]?.[2] as AlertButton[];
    expect(buttons).toHaveLength(2);
    const styles = buttons.map((b) => b.style);
    expect(styles).toContain("cancel");
    expect(buttons.some((b) => b.text === "Continue")).toBe(true);

    const cancel = buttons.find((b) => b.style === "cancel");
    cancel?.onPress?.();
    await pending;
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("ensurePrivacyAck continues and acks when confirm pressed", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const onConfirm = jest.fn();

    const pending = ensurePrivacyAck(onConfirm, alertCopy);
    await flushMicrotasks();

    const buttons = mockAlert.mock.calls[0]?.[2] as AlertButton[];
    expect(buttons).toHaveLength(2);
    const confirm = buttons.find((b) => b.style !== "cancel");
    confirm?.onPress?.();
    await pending;
    expect(onConfirm).toHaveBeenCalledWith(true);
  });
});
