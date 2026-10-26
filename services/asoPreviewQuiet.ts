/**
 * __DEV__ only — App Preview 录屏静音：关掉 LogBox 黄条等调试障碍物。
 */

import { LogBox } from "react-native";

let enabled = false;

/** 本 JS 会话内是否处于 ASO 录屏静音模式 */
export function isAsoPreviewQuiet(): boolean {
  return enabled;
}

/** 开启后对本会话持续 ignoreAllLogs，避免黄条再次弹出 */
export function enableAsoPreviewQuiet(): void {
  if (!__DEV__) {
    return;
  }
  enabled = true;
  LogBox.ignoreAllLogs(true);
}
