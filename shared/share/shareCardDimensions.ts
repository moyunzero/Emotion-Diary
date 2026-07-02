import { PixelRatio } from "react-native";
import {
  SHARE_CARD_ASPECT_RATIO,
  SHARE_CARD_HEIGHT_PX,
  SHARE_CARD_WIDTH_PX,
} from "../../constants/performance";

export { SHARE_CARD_ASPECT_RATIO, SHARE_CARD_HEIGHT_PX, SHARE_CARD_WIDTH_PX };

export function toLogicalSize(
  widthPx: number,
  heightPx: number,
): { width: number; height: number } {
  const ratio = PixelRatio.get();
  return {
    width: widthPx / ratio,
    height: heightPx / ratio,
  };
}
