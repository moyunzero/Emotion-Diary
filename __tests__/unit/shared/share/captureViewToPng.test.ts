const mockCaptureRef = jest.fn();
const mockRunAfterInteractions = jest.fn((cb: () => void) => cb());

jest.mock("react-native-view-shot", () => ({
  captureRef: (...args: unknown[]) => mockCaptureRef(...args),
}));

jest.mock("react-native", () => ({
  InteractionManager: {
    runAfterInteractions: (cb: () => void) => mockRunAfterInteractions(cb),
  },
  Platform: { OS: "ios" },
  PixelRatio: { get: jest.fn(() => 2) },
}));

import type { View } from "react-native";
import { captureViewToPng } from "@/shared/share/captureViewToPng";

function makeTarget(width: number, height: number): View {
  return {
    measure: (cb: (x: number, y: number, w: number, h: number) => void) => {
      cb(0, 0, width, height);
    },
  } as unknown as View;
}

describe("captureViewToPng", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCaptureRef.mockResolvedValue("file:///tmp/share-card.png");
  });

  it("calls captureRef with toLogicalSize(1080, 1920) when PixelRatio is 2", async () => {
    const target = makeTarget(360, 640);

    await captureViewToPng(target);

    expect(mockRunAfterInteractions).toHaveBeenCalled();
    expect(mockCaptureRef).toHaveBeenCalledWith(
      target,
      expect.objectContaining({
        format: "png",
        width: 540,
        height: 960,
        result: "tmpfile",
      }),
    );
  });

  it("rejects when measure returns zero dimensions", async () => {
    const target = makeTarget(0, 0);

    await expect(captureViewToPng(target)).rejects.toThrow(
      "Invalid capture dimensions",
    );
    expect(mockCaptureRef).not.toHaveBeenCalled();
  });
});
