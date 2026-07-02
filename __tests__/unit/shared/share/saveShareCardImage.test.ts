jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("expo-media-library", () => ({
  requestPermissionsAsync: jest.fn(),
  saveToLibraryAsync: jest.fn(),
}));

const mockAlert = jest.fn();

jest.mock("react-native", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
  Linking: { openSettings: jest.fn() },
  Platform: { OS: "ios" },
}));

import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { saveShareCardImage } from "@/shared/share/saveShareCardImage";

const copy = {
  permissionTitle: "需要相册权限",
  permissionMessage: "请允许保存图片",
  cancelLabel: "取消",
  openSettingsLabel: "打开设置",
  successTitle: "已保存",
  successMessage: "分享卡已存入相册",
};

describe("saveShareCardImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saves to library and shows success alert", async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
    });
    (MediaLibrary.saveToLibraryAsync as jest.Mock).mockResolvedValue(undefined);

    await saveShareCardImage("file:///tmp/share.png", copy);

    expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith(
      "file:///tmp/share.png",
    );
    expect(Haptics.notificationAsync).toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith(
      copy.successTitle,
      copy.successMessage,
    );
  });

  it("shows permission alert when denied", async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: false,
    });

    await expect(
      saveShareCardImage("file:///tmp/share.png", copy),
    ).rejects.toThrow("Media library permission denied");

    expect(mockAlert).toHaveBeenCalledWith(
      copy.permissionTitle,
      copy.permissionMessage,
      expect.any(Array),
    );
    expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
  });
});
