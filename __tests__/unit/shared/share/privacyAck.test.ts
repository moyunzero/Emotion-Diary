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
};

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

  it("ensurePrivacyAck shows Alert when ack is missing", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const onConfirm = jest.fn();

    await ensurePrivacyAck(onConfirm, alertCopy);

    expect(mockAlert).toHaveBeenCalled();
    const buttons = mockAlert.mock.calls[0]?.[2] as Array<{
      onPress?: () => void;
    }>;
    expect(buttons).toHaveLength(1);
    buttons?.[0]?.onPress?.();
    expect(onConfirm).toHaveBeenCalledWith(true);
  });
});
