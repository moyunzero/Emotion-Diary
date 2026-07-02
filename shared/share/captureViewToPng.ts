import { InteractionManager, Platform, type View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { REVIEW_EXPORT_CAPTURE_QUALITY } from "../../constants/performance";
import {
  SHARE_CARD_HEIGHT_PX,
  SHARE_CARD_WIDTH_PX,
  toLogicalSize,
} from "./shareCardDimensions";

export type CaptureViewResult = string;

export type CaptureViewToPngOptions = {
  widthPx?: number;
  heightPx?: number;
};

/**
 * Captures a mounted View to PNG. Web returns data-uri; native returns tmpfile path.
 */
export async function captureViewToPng(
  target: View,
  options?: CaptureViewToPngOptions,
): Promise<CaptureViewResult> {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });

  await new Promise<{ width: number; height: number }>((resolve, reject) => {
    target.measure((_x, _y, width, height) => {
      if (width <= 0 || height <= 0) {
        reject(new Error("Invalid capture dimensions"));
        return;
      }
      resolve({ width, height });
    });
  });

  const widthPx = options?.widthPx ?? SHARE_CARD_WIDTH_PX;
  const heightPx = options?.heightPx ?? SHARE_CARD_HEIGHT_PX;
  const logical = toLogicalSize(widthPx, heightPx);
  const result = Platform.OS === "web" ? "data-uri" : "tmpfile";

  const uri = await captureRef(target, {
    format: "png",
    quality: REVIEW_EXPORT_CAPTURE_QUALITY,
    result,
    width: logical.width,
    height: logical.height,
  });

  if (!uri || typeof uri !== "string") {
    throw new Error("Capture failed, please try again");
  }
  return uri;
}
