jest.mock("react-native", () => ({
  PixelRatio: { get: jest.fn(() => 3) },
}));

import {
  SHARE_CARD_ASPECT_RATIO,
  SHARE_CARD_HEIGHT_PX,
  SHARE_CARD_WIDTH_PX,
  toLogicalSize,
} from "@/shared/share/shareCardDimensions";

describe("shareCardDimensions", () => {
  it("SHARE_CARD_ASPECT_RATIO equals 9/16", () => {
    expect(SHARE_CARD_ASPECT_RATIO).toBe(9 / 16);
  });

  it("exports fixed capture pixel dimensions", () => {
    expect(SHARE_CARD_WIDTH_PX).toBe(1080);
    expect(SHARE_CARD_HEIGHT_PX).toBe(1920);
  });

  it("toLogicalSize(1080, 1920) divides by PixelRatio.get()", () => {
    const { width, height } = toLogicalSize(1080, 1920);
    expect(width).toBe(360);
    expect(height).toBe(640);
  });
});
